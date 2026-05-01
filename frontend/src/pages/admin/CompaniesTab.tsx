import { useState, useEffect, useCallback } from 'react';
import type { CompanyDto } from '@/types';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';
import { listCompanies, createCompany, updateCompany } from '@/api/companies';
import { formatDate } from '@/utils/format';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function CompaniesTab() {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCompanies();
      setCompanies(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Create Company
        </button>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.key}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{c.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingCompany(c)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateCompanyModal onClose={() => { setShowCreate(false); fetchCompanies(); }} />}
      {editingCompany && <EditCompanyModal company={editingCompany} onClose={() => { setEditingCompany(null); fetchCompanies(); }} />}
    </div>
  );
}

function CreateCompanyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCompany({ name, key: key.toUpperCase(), description: description || undefined });
      onClose();
    } catch {
      setError('Failed to create company. Key must be unique.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Company" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" value={name} onChange={setName} required className="col-span-2" />
          <Field label="Key" value={key} onChange={setKey} required maxLength={10} />
        </div>
        <Field label="Description" value={description} onChange={setDescription} textarea />
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

function EditCompanyModal({ company, onClose }: { company: CompanyDto; onClose: () => void }) {
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description ?? '');
  const [active, setActive] = useState(company.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateCompany(company.id, { name: name || undefined, description: description || undefined, active });
      onClose();
    } catch {
      setError('Failed to update company.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${company.key}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Description" value={description} onChange={setDescription} textarea />
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