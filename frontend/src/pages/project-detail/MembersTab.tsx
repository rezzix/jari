import { useState, useEffect, useCallback } from 'react';
import type { MemberDto, UserDto } from '@/types';
import { getMembers, addMembers, removeMember } from '@/api/projects';
import { listAllUsers } from '@/api/users';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

export default function MembersTab({ projectId, managerId, canEdit }: { projectId: number; managerId: number; canEdit: boolean }) {
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