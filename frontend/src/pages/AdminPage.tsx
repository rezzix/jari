import { useState, useEffect, useCallback } from 'react';
import type {
  UserDto, ProgramDto, IssueTypeDto, IssueStatusDto,
  IssueStatusCategory, AdminUpdateUserRequest,
} from '@/types';
import {
  listUsers, createUser, adminUpdateUser, deactivateUser,
  listPrograms, createProgram, updateProgram, deleteProgram,
  getOrganization, updateOrganization,
  listIssueTypes, createIssueType, updateIssueType, deleteIssueType,
  listIssueStatuses, createIssueStatus, updateIssueStatus, deleteIssueStatus,
} from '@/api/admin';
import { formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

type Tab = 'users' | 'programs' | 'organization' | 'issue-types' | 'issue-statuses';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'programs', label: 'Programs' },
    { key: 'organization', label: 'Organization' },
    { key: 'issue-types', label: 'Issue Types' },
    { key: 'issue-statuses', label: 'Issue Statuses' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Administration</h2>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'programs' && <ProgramsTab />}
      {activeTab === 'organization' && <OrganizationTab />}
      {activeTab === 'issue-types' && <IssueTypesTab />}
      {activeTab === 'issue-statuses' && <IssueStatusesTab />}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Create User
        </button>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                      u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">{u.active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingUser(u)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                      {u.active && (
                        <button onClick={async () => { await deactivateUser(u.id); fetchUsers(); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => { setShowCreate(false); fetchUsers(); }} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => { setEditingUser(null); fetchUsers(); }} />}
    </div>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createUser({ username, email, password, firstName, lastName, role });
      onClose();
    } catch {
      setError('Failed to create user. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username" value={username} onChange={setUsername} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
        </div>
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} required />
          <Field label="Last name" value={lastName} onChange={setLastName} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
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

function EditUserModal({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const req: AdminUpdateUserRequest = { email, firstName, lastName, role, active };
      await adminUpdateUser(user.id, req);
      onClose();
    } catch {
      setError('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Programs Tab ─────────────────────────────────────────────────────────────

function ProgramsTab() {
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramDto | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPrograms();
      setPrograms(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this program?')) return;
    await deleteProgram(id);
    fetchPrograms();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Create Program
        </button>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.key}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.managerName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingProgram(p)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateProgramModal onClose={() => { setShowCreate(false); fetchPrograms(); }} />}
      {editingProgram && <EditProgramModal program={editingProgram} onClose={() => { setEditingProgram(null); fetchPrograms(); }} />}
    </div>
  );
}

function CreateProgramModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [users, setUsers] = useState<UserDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUsers().then((res) => {
      const mgrs = res.data.filter((u) => u.active && (u.role === 'ADMIN' || u.role === 'MANAGER'));
      setUsers(mgrs);
      if (mgrs.length > 0) setManagerId(String(mgrs[0].id));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createProgram({ name, key: key.toUpperCase(), description: description || undefined, managerId: Number(managerId) });
      onClose();
    } catch {
      setError('Failed to create program.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Program" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" value={name} onChange={setName} required className="col-span-2" />
          <Field label="Key" value={key} onChange={setKey} required maxLength={10} />
        </div>
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>)}
          </select>
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

function EditProgramModal({ program, onClose }: { program: ProgramDto; onClose: () => void }) {
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? '');
  const [managerId, setManagerId] = useState(String(program.managerId));
  const [users, setUsers] = useState<UserDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUsers().then((res) => {
      const mgrs = res.data.filter((u) => u.active && (u.role === 'ADMIN' || u.role === 'MANAGER'));
      setUsers(mgrs);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProgram(program.id, {
        name: name || undefined,
        description: description || undefined,
        managerId: Number(managerId) || undefined,
      });
      onClose();
    } catch {
      setError('Failed to update program.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${program.key}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Organization Tab ─────────────────────────────────────────────────────────

function OrganizationTab() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrganization().then((data) => {
      setName(data.name);
      setAddress(data.address ?? '');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await updateOrganization({ name, address: address || undefined });
      setMsg('Organization updated successfully.');
    } catch {
      setError('Failed to update organization.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SpinnerWrapper />;

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Organization Name" value={name} onChange={setName} required />
          <Field label="Address" value={address} onChange={setAddress} textarea />
          {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">{msg}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Spinner className="h-4 w-4" />}Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Issue Types Tab ──────────────────────────────────────────────────────────

function IssueTypesTab() {
  const [types, setTypes] = useState<IssueTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try { setTypes(await listIssueTypes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createIssueType({ name: newName.trim() });
      setNewName('');
      fetchTypes();
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    await updateIssueType(id, { name: editingName.trim() });
    setEditingId(null);
    fetchTypes();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this issue type?')) return;
    await deleteIssueType(id);
    fetchTypes();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New issue type name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} disabled={saving || !newName.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{t.id}</td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(t.id)}
                        autoFocus
                      />
                    ) : t.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === t.id ? (
                        <>
                          <button onClick={() => handleUpdate(t.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(t.id); setEditingName(t.name); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No issue types found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Issue Statuses Tab ──────────────────────────────────────────────────────

function IssueStatusesTab() {
  const [statuses, setStatuses] = useState<IssueStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<IssueStatusCategory>('TODO');
  const [newDefault, setNewDefault] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<IssueStatusCategory>('TODO');
  const [editDefault, setEditDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try { setStatuses(await listIssueStatuses()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createIssueStatus({ name: newName.trim(), category: newCategory, isDefault: newDefault });
      setNewName('');
      setNewDefault(false);
      fetchStatuses();
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await updateIssueStatus(id, { name: editName.trim(), category: editCategory, isDefault: editDefault });
    setEditingId(null);
    fetchStatuses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this issue status?')) return;
    await deleteIssueStatus(id);
    fetchStatuses();
  };

  const categoryColor = (cat: string) => {
    if (cat === 'TODO') return 'bg-gray-100 text-gray-700';
    if (cat === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New status name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as IssueStatusCategory)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" checked={newDefault} onChange={(e) => setNewDefault(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm text-gray-600">Default</span>
          </label>
          <button onClick={handleCreate} disabled={saving || !newName.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Default</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{s.id}</td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleUpdate(s.id)} autoFocus />
                    ) : s.name}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as IssueStatusCategory)} className="px-2 py-1 border border-gray-300 rounded text-sm">
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(s.category)}`}>{s.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <input type="checkbox" checked={editDefault} onChange={(e) => setEditDefault(e.target.checked)} className="rounded border-gray-300" />
                    ) : (
                      s.isDefault ? 'Yes' : 'No'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === s.id ? (
                        <>
                          <button onClick={() => handleUpdate(s.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(s.id); setEditName(s.name); setEditCategory(s.category); setEditDefault(s.isDefault); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No issue statuses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

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

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}