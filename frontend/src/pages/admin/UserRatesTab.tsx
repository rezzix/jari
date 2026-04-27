import { useState, useEffect } from 'react';
import type { UserDto, UserRateDto } from '@/types';
import { listUsers } from '@/api/admin';
import { getUserRates, createUserRate, updateUserRate, deleteUserRate } from '@/api/userRates';
import Spinner from '@/components/common/Spinner';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function UserRatesTab() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [rates, setRates] = useState<UserRateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formRate, setFormRate] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState('');

  useEffect(() => {
    listUsers().then(res => {
      const userList = res.data ?? res;
      setUsers(Array.isArray(userList) ? userList : []);
    });
  }, []);

  const fetchRates = async (userId: number) => {
    setLoading(true);
    try {
      const data = await getUserRates(userId);
      setRates(data);
    } catch { setRates([]); } finally { setLoading(false); }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUser(userId);
    setShowForm(false);
    setEditId(null);
    fetchRates(userId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formRate) return;
    setSaving(true);
    try {
      await createUserRate({ userId: selectedUser, hourlyRate: Number(formRate), effectiveFrom: formDate });
      setFormRate(''); setShowForm(false);
      fetchRates(selectedUser);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleUpdateRate = async (id: number) => {
    if (!editRate) return;
    setSaving(true);
    try {
      await updateUserRate(id, { hourlyRate: Number(editRate) });
      setEditId(null);
      if (selectedUser) fetchRates(selectedUser);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this rate?')) return;
    await deleteUserRate(id);
    if (selectedUser) fetchRates(selectedUser);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select User:</label>
        <select value={selectedUser ?? ''} onChange={e => handleSelectUser(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">-- Select --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
        </select>
        {selectedUser && (
          <button onClick={() => setShowForm(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">+ Add Rate</button>
        )}
      </div>

      {showForm && selectedUser && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hourly Rate ($)</label>
            <input type="number" step="0.01" min="0" value={formRate} onChange={e => setFormRate(e.target.value)} required placeholder="e.g. 75.00" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Effective From</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button type="submit" disabled={saving || !formRate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
        </form>
      )}

      {loading ? <SpinnerWrapper /> : !selectedUser ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Select a user to view their hourly rates.</div>
      ) : rates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No rates configured for this user.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Rate</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Effective From</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map(rate => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {editId === rate.id ? (
                      <input type="number" step="0.01" value={editRate} onChange={e => setEditRate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-28" />
                    ) : (
                      <span className="font-medium">${rate.hourlyRate.toFixed(2)}/hr</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{rate.effectiveFrom}</td>
                  <td className="px-3 py-3">
                    {editId === rate.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateRate(rate.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                        <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(rate.id); setEditRate(rate.hourlyRate.toString()); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(rate.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}