import { useState, useEffect, useCallback } from 'react';
import { listProjects } from '@/api/projects';
import { listProjectIssues } from '@/api/issues';
import { listSprints } from '@/api/sprints';
import { listTimeLogs, getTimeByProject, getTimeByUser } from '@/api/timeLogs';
import { listAllUsers } from '@/api/users';
import { listIssueStatuses } from '@/api/admin';
import type { IssueDto, ProjectDto, UserDto, IssueStatusDto, SprintDto, TimeLogDto } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, priorityColor, statusColor } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

type Section = 'overview' | 'aging' | 'velocity' | 'workload' | 'time' | 'trends';

export default function TimeReportsPage() {
  const { user: currentUser } = useAuth();
  const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const [section, setSection] = useState<Section>('overview');
  const [projectId, setProjectId] = useState<number | null>(null);

  if (!isManager) {
    return <div className="text-center text-gray-500 py-8">Access restricted to managers and admins.</div>;
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'overview', label: 'Project Overview' },
    { key: 'aging', label: 'Issue Aging' },
    { key: 'velocity', label: 'Sprint Velocity' },
    { key: 'workload', label: 'Workload' },
    { key: 'time', label: 'Time Reports' },
    { key: 'trends', label: 'Time Trends' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reports</h2>

      <div className="flex items-center gap-3">
        <ProjectSelector value={projectId} onChange={setProjectId} />
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                section === s.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {section === 'overview' && <OverviewReport projectId={projectId} />}
      {section === 'aging' && <AgingReport projectId={projectId} />}
      {section === 'velocity' && <VelocityReport projectId={projectId} />}
      {section === 'workload' && <WorkloadReport projectId={projectId} />}
      {section === 'time' && <TimeReport />}
      {section === 'trends' && <TrendsReport />}
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function ProjectSelector({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  useEffect(() => { listProjects().then(setProjects); }, []);
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="">Select project</option>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
    </select>
  );
}

function BarChart({ items, maxValue }: { items: { label: string; value: number; color: string }[]; maxValue: number }) {
  const max = maxValue || Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 w-32 shrink-0 truncate" title={item.label}>{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
            <div className={`h-5 rounded-full ${item.color} flex items-center justify-end pr-2 transition-all`} style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}>
              {item.value > 0 && <span className="text-[10px] font-bold text-inherit">{item.value}</span>}
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-gray-400">No data</p>}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Overview Report ─────────────────────────────────────────────────────────

function OverviewReport({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [statuses, setStatuses] = useState<IssueStatusDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { listIssueStatuses().then(setStatuses); }, []);

  const fetch = useCallback(async () => {
    if (!projectId) { setIssues([]); return; }
    setLoading(true);
    try {
      const data = await listProjectIssues(projectId, { size: 200 });
      setIssues(data);
    } catch { setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const byStatus = statuses.map((s) => ({
    label: s.name,
    value: issues.filter((i) => i.statusId === s.id).length,
    color: statusColor(s.name).includes('green') ? 'bg-green-500' : statusColor(s.name).includes('blue') ? 'bg-blue-500' : statusColor(s.name).includes('purple') ? 'bg-purple-500' : 'bg-gray-400',
  }));

  const byPriority = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => ({
    label: p.charAt(0) + p.slice(1).toLowerCase(),
    value: issues.filter((i) => i.priority === p).length,
    color: priorityColor(p).includes('red') ? 'bg-red-500' : priorityColor(p).includes('orange') ? 'bg-orange-500' : priorityColor(p).includes('yellow') ? 'bg-yellow-500' : 'bg-blue-500',
  }));

  const byType = Object.entries(
    issues.reduce<Record<string, number>>((acc, i) => { acc[i.typeName] = (acc[i.typeName] || 0) + 1; return acc; }, {})
  ).map(([label, value]) => ({ label, value, color: 'bg-primary-500' }));

  const doneCount = issues.filter((i) => { const s = i.statusName.toLowerCase(); return s.includes('done') || s.includes('complete'); }).length;
  const unassigned = issues.filter((i) => !i.assigneeId).length;

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view overview</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Issues" value={issues.length} color="border-gray-200 bg-white" />
            <StatCard label="Completed" value={doneCount} sub={issues.length ? `${((doneCount / issues.length) * 100).toFixed(0)}%` : ''} color="border-green-200 bg-green-50" />
            <StatCard label="Unassigned" value={unassigned} color="border-orange-200 bg-orange-50" />
            <StatCard label="Types" value={byType.length} color="border-blue-200 bg-blue-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Issues by Status</h3>
              <BarChart items={byStatus} maxValue={0} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Issues by Priority</h3>
              <BarChart items={byPriority} maxValue={0} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Issues by Type</h3>
            <BarChart items={byType} maxValue={0} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Aging Report ────────────────────────────────────────────────────────────

function AgingReport({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'age' | 'updated'>('age');

  const fetch = useCallback(async () => {
    if (!projectId) { setIssues([]); return; }
    setLoading(true);
    try { setIssues(await listProjectIssues(projectId, { size: 200 })); } catch { setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const now = Date.now();
  const openIssues = issues.filter((i) => {
    const s = i.statusName.toLowerCase();
    return !s.includes('done') && !s.includes('complete');
  });

  const aged = openIssues.map((i) => ({
    ...i,
    daysOld: Math.floor((now - new Date(i.createdAt).getTime()) / 86400000),
    daysSinceUpdate: Math.floor((now - new Date(i.updatedAt).getTime()) / 86400000),
  }));

  const sorted = [...aged].sort((a, b) => sort === 'age' ? b.daysOld - a.daysOld : b.daysSinceUpdate - a.daysSinceUpdate);

  const staleCount = aged.filter((i) => i.daysSinceUpdate > 7).length;
  const oldCount = aged.filter((i) => i.daysOld > 30).length;

  return (
    <div className="space-y-6">
      {projectId && (
        <div className="flex items-center gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value as 'age' | 'updated')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="age">Sort by age</option>
            <option value="updated">Sort by stale time</option>
          </select>
        </div>
      )}

      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view aging report</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Open Issues" value={openIssues.length} color="border-gray-200 bg-white" />
            <StatCard label="Stale (>7d no update)" value={staleCount} color="border-orange-200 bg-orange-50" />
            <StatCard label="Old (>30d)" value={oldCount} color="border-red-200 bg-red-50" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Age (days)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Stale (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((i) => (
                  <tr key={i.id} className={i.daysSinceUpdate > 7 ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-2 font-mono text-xs text-primary-600">{i.issueKey}</td>
                    <td className="px-4 py-2 text-gray-900 truncate max-w-[200px]">{i.title}</td>
                    <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(i.statusName)}`}>{i.statusName}</span></td>
                    <td className="px-4 py-2 text-gray-500">{i.assigneeName ?? 'Unassigned'}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{i.daysOld}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{i.daysSinceUpdate}</td>
                  </tr>
                ))}
                {sorted.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No open issues</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sprint Velocity ─────────────────────────────────────────────────────────

function VelocityReport({ projectId }: { projectId: number | null }) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setSprints([]); setIssues([]); return; }
    setLoading(true);
    try {
      const [sprintData, issueData] = await Promise.all([
        listSprints(projectId),
        listProjectIssues(projectId, { size: 200 }),
      ]);
      setSprints(sprintData);
      setIssues(issueData);
    } catch { setSprints([]); setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const sprintStats = sprints.map((sprint) => {
    const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
    const completed = sprintIssues.filter((i) => { const st = i.statusName.toLowerCase(); return st.includes('done') || st.includes('complete'); }).length;
    return { sprint, total: sprintIssues.length, completed, remaining: sprintIssues.length - completed };
  });

  const maxIssues = Math.max(...sprintStats.map((s) => s.total), 1);

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view sprint velocity</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          {sprintStats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No sprints found for this project</div>
          ) : (
            <div className="space-y-3">
              {sprintStats.map(({ sprint, total, completed, remaining }) => (
                <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{sprint.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        sprint.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        sprint.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>{sprint.status}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {completed}/{total} completed
                    </div>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div className="bg-green-500 rounded-l-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${total ? (completed / maxIssues) * 100 : 0}%`, minWidth: completed > 0 ? '20px' : '0' }}>
                      {completed > 0 ? completed : ''}
                    </div>
                    <div className="bg-orange-400 rounded-r-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${total ? (remaining / maxIssues) * 100 : 0}%`, minWidth: remaining > 0 ? '20px' : '0' }}>
                      {remaining > 0 ? remaining : ''}
                    </div>
                  </div>
                  {sprint.startDate && sprint.endDate && (
                    <div className="text-xs text-gray-400 mt-1">{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Workload Report ─────────────────────────────────────────────────────────

function WorkloadReport({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setIssues([]); return; }
    setLoading(true);
    try { setIssues(await listProjectIssues(projectId, { size: 200 })); } catch { setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const byAssignee = Object.entries(
    issues.reduce<Record<string, { total: number; open: number; done: number }>>((acc, i) => {
      const name = i.assigneeName ?? 'Unassigned';
      if (!acc[name]) acc[name] = { total: 0, open: 0, done: 0 };
      acc[name].total++;
      const s = i.statusName.toLowerCase();
      if (s.includes('done') || s.includes('complete')) acc[name].done++;
      else acc[name].open++;
      return acc;
    }, {})
  ).map(([name, counts]) => ({ name, ...counts }));

  const maxTotal = Math.max(...byAssignee.map((a) => a.total), 1);

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view workload</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Team Members" value={byAssignee.filter((a) => a.name !== 'Unassigned').length} color="border-gray-200 bg-white" />
            <StatCard label="Unassigned Issues" value={byAssignee.find((a) => a.name === 'Unassigned')?.total ?? 0} color="border-orange-200 bg-orange-50" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Open</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Done</th>
                  <th className="px-4 py-3 font-medium text-gray-500 w-48">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byAssignee.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{row.open}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{row.done}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 h-4">
                        <div className="bg-green-500 rounded-l" style={{ width: `${(row.done / maxTotal) * 100}%`, minWidth: row.done > 0 ? '4px' : '0' }} />
                        <div className="bg-orange-400 rounded-r" style={{ width: `${(row.open / maxTotal) * 100}%`, minWidth: row.open > 0 ? '4px' : '0' }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {byAssignee.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No issues</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Time Reports (by project / by user) ────────────────────────────────────

function TimeReport() {
  const [tab, setTab] = useState<'project' | 'user'>('project');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [users, setUsers] = useState<UserDto[]>([]);
  const [projectData, setProjectData] = useState<{ projectId: number; totalHours: number }[]>([]);
  const [userData, setUserData] = useState<{ userId: number; totalHours: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      await listAllUsers({ active: 'true' }).then(setUsers);
      if (tab === 'project') {
        setProjectData(await getTimeByProject(startDate, endDate));
      } else {
        setUserData(await getTimeByUser(startDate, endDate));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const userName = (id: number) => { const u = users.find((u) => u.id === id); return u ? `${u.firstName} ${u.lastName}` : `User ${id}`; };
  const totalH = (d: { totalHours: number }[]) => d.reduce((s, r) => s + r.totalHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button onClick={generate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 self-end">Generate</button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button onClick={() => setTab('project')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'project' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>By Project</button>
          <button onClick={() => setTab('user')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'user' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>By User</button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tab === 'project' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectData.map((r) => (
                  <tr key={r.projectId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Project {r.projectId}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                  </tr>
                ))}
                {projectData.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {projectData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(projectData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userData.map((r) => (
                  <tr key={r.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{userName(r.userId)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                  </tr>
                ))}
                {userData.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {userData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(userData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Time Trends ────────────────────────────────────────────────────────────

function TrendsReport() {
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState<{ week: string; hours: number }[]>([]);
  const [byUser, setByUser] = useState<{ userName: string; weekHours: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const userList = await listAllUsers({ active: 'true' });
      setUsers(userList);

      const now = new Date();
      const weekStarts: string[] = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        weekStarts.push(monday.toISOString().slice(0, 10));
      }

      const allLogs: TimeLogDto[] = [];
      for (const ws of weekStarts) {
        const endDate = new Date(ws + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 6);
        const logs = await listTimeLogs({ startDate: ws, endDate: endDate.toISOString().slice(0, 10), size: 200 });
        allLogs.push(...logs);
      }

      const byWeek: Record<string, number> = {};
      for (const ws of weekStarts) byWeek[ws] = 0;
      for (const log of allLogs) {
        const logDate = new Date(log.logDate + 'T00:00:00');
        const day = logDate.getDay();
        const diff = logDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(logDate);
        monday.setDate(diff);
        const key = monday.toISOString().slice(0, 10);
        if (byWeek[key] !== undefined) byWeek[key] += log.hours;
      }

      setData(weekStarts.map((ws) => ({ week: ws, hours: byWeek[ws] || 0 })));

      // Per-user breakdown
      const userMap: Record<string, Record<string, number>> = {};
      for (const log of allLogs) {
        const uName = log.userName;
        const logDate = new Date(log.logDate + 'T00:00:00');
        const day = logDate.getDay();
        const diff = logDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(logDate);
        monday.setDate(diff);
        const key = monday.toISOString().slice(0, 10);
        if (!userMap[uName]) userMap[uName] = {};
        for (const ws of weekStarts) { if (userMap[uName][ws] === undefined) userMap[uName][ws] = 0; }
        if (userMap[uName][key] !== undefined) userMap[uName][key] += log.hours;
      }

      setByUser(Object.entries(userMap).map(([userName, weekHours]) => ({ userName, weekHours })));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [weeks]);

  useEffect(() => { fetch(); }, [fetch]);

  const maxHours = Math.max(...data.map((d) => d.hours), 1);
  const totalHours = data.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Weeks:</label>
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={12}>12</option>
          <option value={16}>16</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Avg Hours/Week" value={(totalHours / (weeks || 1)).toFixed(1)} color="border-gray-200 bg-white" />
            <StatCard label="Total Hours" value={totalHours.toFixed(1)} color="border-primary-200 bg-primary-50" />
          </div>

          {/* Weekly bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Weekly Hours</h3>
            <div className="flex items-end gap-2 h-40">
              {data.map((d) => {
                const pct = (d.hours / maxHours) * 100;
                const dateObj = new Date(d.week + 'T00:00:00');
                return (
                  <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{d.hours > 0 ? d.hours.toFixed(1) : ''}</span>
                    <div className="w-full bg-primary-500 rounded-t-md transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                    <span className="text-[10px] text-gray-400">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-user trend table */}
          {byUser.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 sticky left-0 bg-gray-50">User</th>
                    {data.map((d) => (
                      <th key={d.week} className="text-right px-3 py-3 font-medium text-gray-400 text-xs whitespace-nowrap">
                        {new Date(d.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byUser.map((row) => {
                    const userTotal = Object.values(row.weekHours).reduce((s, h) => s + h, 0);
                    return (
                      <tr key={row.userName} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900 font-medium sticky left-0 bg-white">{row.userName}</td>
                        {data.map((d) => (
                          <td key={d.week} className="px-3 py-2 text-right font-mono text-xs text-gray-600">
                            {(row.weekHours[d.week] || 0) > 0 ? (row.weekHours[d.week] || 0).toFixed(1) : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right font-semibold">{userTotal.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}