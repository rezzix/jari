import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectDto, ProgramDto, UserDto } from '@/types';
import { listProjects, createProject } from '@/api/projects';
import { listPrograms } from '@/api/admin';
import { listAllUsers } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Create Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Program</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary-600">{p.key}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.programName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.managerName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No projects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => { setShowCreate(false); fetchProjects(); }} />}
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listPrograms().then((res) => {
      setPrograms(res.data);
      if (res.data.length > 0) setProgramId(String(res.data[0].id));
    }).catch(() => setLoadError('Failed to load programs. You may not have permission.'));
    listAllUsers({ active: 'true' }).then((users) => {
      setUsers(users);
      if (users.length > 0) setManagerId(String(users[0].id));
    }).catch(() => setLoadError('Failed to load users. You may not have permission.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const project = await createProject({
        name,
        key: key.toUpperCase(),
        description: description || undefined,
        programId: Number(programId),
        managerId: Number(managerId),
        memberIds: memberIds.length > 0 ? memberIds : undefined,
      });
      navigate(`/projects/${project.id}`);
    } catch {
      setError('Failed to create project. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (userId: number) => {
    setMemberIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const eligibleManagers = users.filter((u) => u.active && (u.role === 'ADMIN' || u.role === 'MANAGER'));

  return (
    <Modal title="Create Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        {loadError && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-3 py-2">{loadError}</div>}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" value={name} onChange={setName} required className="col-span-2" />
          <Field label="Key" value={key} onChange={setKey} required maxLength={10} />
        </div>
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {eligibleManagers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
            {users.filter((u) => u.active).map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                <input type="checkbox" checked={memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} className="rounded border-gray-300" />
                <span>{u.firstName} {u.lastName} ({u.username})</span>
                <span className="text-xs text-gray-400 ml-auto">{u.role}</span>
              </label>
            ))}
          </div>
        </div>
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