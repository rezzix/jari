import { useState, useEffect, useCallback } from 'react';
import type { IssueTypeDto, IssueStatusDto, IssueStatusCategory } from '@/types';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';
import {
  getOrganization, updateOrganization,
  listIssueTypes, createIssueType, updateIssueType, deleteIssueType,
  listIssueStatuses, createIssueStatus, updateIssueStatus, deleteIssueStatus,
} from '@/api/admin';
import UsersTab from './UsersTab';
import ProgramsTab from './ProgramsTab';
import CompaniesTab from './CompaniesTab';
import IssueStatusesTab from './StatusesTab';

type Tab = 'companies' | 'programs' | 'users' | 'issues' | 'organization';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('companies');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'companies', label: 'Companies' },
    { key: 'programs', label: 'Programs' },
    { key: 'users', label: 'Users' },
    { key: 'issues', label: 'Issues' },
    { key: 'organization', label: 'Organization' },
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

      {activeTab === 'companies' && <CompaniesTab />}
      {activeTab === 'programs' && <ProgramsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'issues' && <IssuesTab />}
      {activeTab === 'organization' && <OrganizationTab />}
    </div>
  );
}

// ─── Organization Tab ─────────────────────────────────────────────────────────

function OrganizationTab() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrganization().then((data) => {
      setName(data.name);
      setAddress(data.address ?? '');
      setWebsite(data.website ?? '');
      setLogo(data.logo ?? '');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await updateOrganization({ name, address: address || undefined, website: website || undefined, logo: logo || undefined });
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
          <Field label="Website" value={website} onChange={setWebsite} />
          <Field label="Logo URL" value={logo} onChange={setLogo} />
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

// ─── Issues Tab (merged Types + Statuses) ─────────────────────────────────────

function IssuesTab() {
  return (
    <div className="space-y-8">
      <IssueTypesSection />
      <IssueStatusesSection />
    </div>
  );
}

function IssueTypesSection() {
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
      <h3 className="text-lg font-semibold text-gray-900">Issue Types</h3>
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

function IssueStatusesSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Issue Statuses</h3>
      <IssueStatusesTab />
    </div>
  );
}