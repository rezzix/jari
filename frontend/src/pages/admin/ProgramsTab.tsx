import { useState, useEffect, useCallback } from 'react';
import type { UserDto, ProgramDto } from '@/types';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';
import {
  listUsers, listPrograms, createProgram, updateProgram, deleteProgram,
} from '@/api/admin';
import { formatDate } from '@/utils/format';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function ProgramsTab() {
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