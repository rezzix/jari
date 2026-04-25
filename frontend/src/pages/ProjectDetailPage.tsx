import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProjectDto, MemberDto, LabelDto, IssueDto, IssueTypeDto, IssueStatusDto, WikiTreeItem, WikiPageDto, WikiSearchHit, UserDto } from '@/types';
import { getProject, getMembers, addMembers, removeMember, getLabels, createLabel, updateLabel, deleteLabel } from '@/api/projects';
import { listProjectIssues, createIssue, updateIssue } from '@/api/issues';
import { getWikiPageTree, getWikiPage, createWikiPage, updateWikiPage, deleteWikiPage, searchWikiPages } from '@/api/wiki';
import { listAllUsers } from '@/api/users';
import { listIssueTypes, listIssueStatuses } from '@/api/admin';
import { useAuth } from '@/hooks/useAuth';
import { priorityColor, statusColor, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

type Tab = 'issues' | 'board' | 'docs' | 'members' | 'labels';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('issues');
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProject(Number(id)).then(setProject).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!project) return <div className="text-center text-gray-500 py-8">Project not found.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'issues', label: 'Issues' },
    { key: 'board', label: 'Board' },
    { key: 'docs', label: 'Docs' },
    { key: 'members', label: 'Members' },
    { key: 'labels', label: 'Labels' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{project.key}</span>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
        </div>
        {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        <p className="text-sm text-gray-400 mt-1">Manager: {project.managerName} {project.programName && `· Program: ${project.programName}`}</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'issues' && <IssuesTab projectId={project.id} projectKey={project.key} canEdit={canEdit} />}
      {activeTab === 'board' && <BoardTab projectId={project.id} projectKey={project.key} />}
      {activeTab === 'docs' && <DocsTab projectId={project.id} />}
      {activeTab === 'members' && <MembersTab projectId={project.id} managerId={project.managerId} canEdit={canEdit} />}
      {activeTab === 'labels' && <LabelsTab projectId={project.id} canEdit={canEdit} />}
    </div>
  );
}

// ─── Issues Tab ────────────────────────────────────────────────────────────────

function IssuesTab({ projectId, projectKey, canEdit }: { projectId: number; projectKey: string; canEdit: boolean }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [statuses, setStatuses] = useState<IssueStatusDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => { listIssueStatuses().then(setStatuses); }, []);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (filterStatus) params.statusId = Number(filterStatus);
      if (filterPriority) params.priority = filterPriority;
      const data = await listProjectIssues(projectId, params);
      setIssues(data);
    } finally {
      setLoading(false);
    }
  }, [projectId, search, filterStatus, filterPriority]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 shrink-0">
            Create Issue
          </button>
        )}
      </div>

      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/issues/${issue.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary-600">{issue.issueKey}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{issue.title}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(issue.priority)}`}>{issue.priority}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(issue.statusName)}`}>{issue.statusName}</span></td>
                  <td className="px-4 py-3 text-gray-500">{issue.assigneeName ?? 'Unassigned'}</td>
                  <td className="px-4 py-3 text-gray-500">{issue.typeName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(issue.updatedAt)}</td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No issues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateIssueModal projectId={projectId} projectKey={projectKey} onClose={() => { setShowCreate(false); fetchIssues(); }} />}
    </div>
  );
}

function CreateIssueModal({ projectId, projectKey, onClose }: { projectId: number; projectKey: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [typeId, setTypeId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [types, setTypes] = useState<IssueTypeDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listIssueTypes().then(setTypes);
    getLabels(projectId).then(setLabels);
    getMembers(projectId).then(setMembers);
  }, [projectId]);

  useEffect(() => {
    if (types.length > 0 && !typeId) setTypeId(String(types[0].id));
  }, [types, typeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createIssue(projectId, {
        title,
        description: description || undefined,
        priority,
        typeId: Number(typeId),
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      });
      onClose();
    } catch {
      setError('Failed to create issue.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) => prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]);
  };

  return (
    <Modal title={`${projectKey}: Create Issue`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Title" value={title} onChange={setTitle} required />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.userId} value={m.userId}>{m.fullName} ({m.username})</option>)}
          </select>
        </div>
        {labels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => (
                <label key={l.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={selectedLabels.includes(l.id)} onChange={() => toggleLabel(l.id)} className="rounded border-gray-300" />
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: l.color + '20', color: l.color }}>{l.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Board Tab ────────────────────────────────────────────────────────────────

function BoardTab({ projectId, projectKey }: { projectId: number; projectKey: string }) {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [statuses, setStatuses] = useState<IssueStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetStatusId, setDropTargetStatusId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [issueData, statusData] = await Promise.all([
        listProjectIssues(projectId, { size: 200 }),
        listIssueStatuses(),
      ]);
      setIssues(issueData);
      setStatuses(statusData.sort((a, b) => a.position - b.position));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const issuesByStatus = statuses.map((status) => ({
    status,
    issues: issues.filter((i) => i.statusId === status.id),
  }));

  const handleDragStart = (issueId: number) => {
    setDraggingId(issueId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetStatusId(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStatusId(statusId);
  };

  const handleDragLeave = () => {
    setDropTargetStatusId(null);
  };

  const handleDrop = async (statusId: number) => {
    if (draggingId === null) return;
    const issue = issues.find((i) => i.id === draggingId);
    if (!issue || issue.statusId === statusId) {
      setDraggingId(null);
      setDropTargetStatusId(null);
      return;
    }

    // Optimistically update UI
    setIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, statusId, statusName: statuses.find((s) => s.id === statusId)!.name } : i)),
    );
    setDraggingId(null);
    setDropTargetStatusId(null);
    setUpdating(true);

    try {
      await updateIssue(projectId, issue.id, { statusId });
    } catch {
      // Revert on failure
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, statusId: issue.statusId, statusName: issue.statusName } : i)),
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;

  return (
    <div className="relative">
      {updating && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Spinner className="h-3 w-3" /> Updating...
          </span>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {issuesByStatus.map(({ status, issues: columnIssues }) => (
          <div
            key={status.id}
            ref={(el) => { columnRefs.current[status.id] = el; }}
            className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border-2 transition-colors ${
              dropTargetStatusId === status.id ? 'border-primary-400 bg-primary-50' : 'border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status.id)}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(status.name)}`}>{status.name}</span>
                <span className="text-xs text-gray-400">{columnIssues.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnIssues.map((issue) => (
                <div
                  key={issue.id}
                  draggable
                  onDragStart={() => handleDragStart(issue.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${projectId}/issues/${issue.id}`)}
                  className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all ${
                    draggingId === issue.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary-600">{issue.issueKey}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColor(issue.priority)}`}>{issue.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-snug mb-1.5">{issue.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{issue.typeName}</span>
                    {issue.assigneeName && <span>{issue.assigneeName}</span>}
                  </div>
                </div>
              ))}
              {columnIssues.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  {draggingId !== null ? 'Drop issue here' : 'No issues'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Docs Tab ──────────────────────────────────────────────────────────────────

function DocsTab({ projectId }: { projectId: number }) {
  const [tree, setTree] = useState<WikiTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState<WikiPageDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchHit[]>([]);
  const [showNewPage, setShowNewPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try { setTree(await getWikiPageTree(projectId)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const fetchPage = useCallback(async () => {
    if (!selectedId) { setPage(null); return; }
    try { setPage(await getWikiPage(projectId, selectedId)); } catch { setPage(null); }
  }, [projectId, selectedId]);

  useEffect(() => { fetchPage(); setEditing(false); }, [fetchPage]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try { setSearchResults(await searchWikiPages(projectId, searchQuery.trim())); } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, searchQuery]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateWikiPage(projectId, selectedId, { title: editTitle, content: editContent });
      setPage(updated);
      setEditing(false);
      fetchTree();
    } catch {
      setError('Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !confirm('Delete this page?')) return;
    await deleteWikiPage(projectId, selectedId);
    setSelectedId(null);
    setPage(null);
    fetchTree();
  };

  const startEditing = () => {
    if (!page) return;
    setEditTitle(page.title);
    setEditContent(page.content ?? '');
    setEditing(true);
  };

  const handleCreatePage = async (title: string, content: string, parentId: number | null) => {
    const created = await createWikiPage(projectId, { title, content: content || undefined, parentId: parentId ?? undefined });
    setShowNewPage(false);
    setSelectedId(created.id);
    fetchTree();
  };

  const selectSearchHit = (hit: WikiSearchHit) => {
    setSelectedId(hit.id);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
      {/* Left panel — page tree */}
      <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((hit) => (
                <button key={hit.id} onClick={() => selectSearchHit(hit)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 truncate">
                  {hit.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-primary-600" /></div>
          ) : tree.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No pages yet</p>
          ) : (
            tree.map((item) => (
              <TreeNode key={item.id} item={item} selectedId={selectedId} onSelect={setSelectedId} depth={0} />
            ))
          )}
        </div>
        <div className="p-2 border-t border-gray-200">
          <button onClick={() => setShowNewPage(true)} className="w-full bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700">
            New Page
          </button>
        </div>
      </div>

      {/* Right panel — content */}
      <div className="flex-1 min-w-0">
        {!page ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">Select a page or create a new one</p>
          </div>
        ) : editing ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving || !editTitle.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{page.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={startEditing} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700">Edit</button>
                <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5">Delete</button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
              <span>By {page.authorName}</span>
              <span>Last updated {formatDate(page.updatedAt)}</span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {page.content || <span className="text-gray-400 italic">No content yet. Click Edit to add content.</span>}
            </div>
          </div>
        )}
      </div>

      {showNewPage && (
        <NewPageModal tree={tree} onClose={() => setShowNewPage(false)} onSubmit={handleCreatePage} />
      )}
    </div>
  );
}

function TreeNode({ item, selectedId, onSelect, depth }: { item: WikiTreeItem; selectedId: number | null; onSelect: (id: number) => void; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-gray-50 ${selectedId === item.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => { onSelect(item.id); if (hasChildren) setExpanded(!expanded); }}
      >
        {hasChildren ? (
          <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="truncate">{item.title}</span>
      </div>
      {hasChildren && expanded && item.children.map((child) => (
        <TreeNode key={child.id} item={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

function NewPageModal({ tree, onClose, onSubmit }: { tree: WikiTreeItem[]; onClose: () => void; onSubmit: (title: string, content: string, parentId: number | null) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatPages = flattenTree(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim(), content, parentId);
    } catch {
      setError('Failed to create page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Page" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Title" value={title} onChange={setTitle} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Page</label>
          <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">None (top level)</option>
            {flatPages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (optional)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write your documentation here..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function flattenTree(items: WikiTreeItem[], result: WikiTreeItem[] = []): WikiTreeItem[] {
  for (const item of items) {
    result.push(item);
    if (item.children.length > 0) flattenTree(item.children, result);
  }
  return result;
}

// ─── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({ projectId, managerId, canEdit }: { projectId: number; managerId: number; canEdit: boolean }) {
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try { setMembers(await getMembers(projectId)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (userId: number) => {
    if (userId === managerId) { alert('Cannot remove the project manager.'); return; }
    if (!confirm('Remove this member?')) return;
    await removeMember(projectId, userId);
    fetchMembers();
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Add Members
          </button>
        </div>
      )}
      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                {canEdit && <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{m.username}</td>
                  <td className="px-4 py-3">{m.fullName}</td>
                  <td className="px-4 py-3">
                    {m.userId === managerId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Manager</span>}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      {m.userId !== managerId && (
                        <button onClick={() => handleRemove(m.userId)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No members.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <AddMembersModal projectId={projectId} currentMembers={members} onClose={() => { setShowAdd(false); fetchMembers(); }} />}
    </div>
  );
}

function AddMembersModal({ projectId, currentMembers, onClose }: { projectId: number; currentMembers: MemberDto[]; onClose: () => void }) {
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers({ active: 'true' }).then(setAllUsers);
  }, []);

  const memberIds = new Set(currentMembers.map((m) => m.userId));
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await addMembers(projectId, selected);
      onClose();
    } catch {
      setError('Failed to add members.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Modal title="Add Members" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
          {available.length === 0 && <p className="text-sm text-gray-500 p-2">All users are already members.</p>}
          {available.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="rounded border-gray-300" />
              <span>{u.firstName} {u.lastName}</span>
              <span className="text-gray-400 text-xs">({u.username})</span>
              <span className="text-xs text-gray-400 ml-auto">{u.role}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || selected.length === 0} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Add {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Labels Tab ────────────────────────────────────────────────────────────────

function LabelsTab({ projectId, canEdit }: { projectId: number; canEdit: boolean }) {
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try { setLabels(await getLabels(projectId)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createLabel(projectId, { name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#6366f1');
    fetchLabels();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await updateLabel(projectId, id, { name: editName.trim(), color: editColor });
    setEditingId(null);
    fetchLabels();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this label?')) return;
    await deleteLabel(projectId, id);
    fetchLabels();
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Label name..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer" />
            </div>
            <button onClick={handleCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add</button>
          </div>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Color</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                {canEdit && <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labels.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editingId === l.id ? (
                      <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
                    ) : (
                      <span className="inline-block w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: l.color }} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === l.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleUpdate(l.id)} autoFocus />
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: l.color + '20', color: l.color }}>{l.name}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      {editingId === l.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(l.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(l.id); setEditName(l.name); setEditColor(l.color); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {labels.length === 0 && (
                <tr><td colSpan={canEdit ? 3 : 2} className="px-4 py-8 text-center text-gray-500">No labels.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, textarea, maxLength, className }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; textarea?: boolean; maxLength?: number; className?: string;
}) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} required={required} maxLength={maxLength} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      )}
    </div>
  );
}