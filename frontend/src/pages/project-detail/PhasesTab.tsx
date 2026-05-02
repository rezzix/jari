import { useState, useEffect, useCallback } from 'react';
import type { PhaseDto, DeliverableDto } from '@/types';
import { listPhases, createPhase, updatePhase, deletePhase, listDeliverables, createDeliverable, updateDeliverable, deleteDeliverable } from '@/api/phases';
import axios from 'axios';
import { formatDate, deliverableStateBadge, deliverableStateLabel } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

export default function PhasesTab({ projectId, canEdit }: { projectId: number; canEdit: boolean }) {
  const [phases, setPhases] = useState<PhaseDto[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);

  // Phase form state
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseDto | null>(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [phaseSaving, setPhaseSaving] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);

  // Deliverable form state
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<DeliverableDto | null>(null);
  const [deliverableForm, setDeliverableForm] = useState({ name: '', description: '', phaseId: 0, dueDate: '', state: 'DRAFT' as DeliverableDto['state'] });
  const [deliverableSaving, setDeliverableSaving] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([listPhases(projectId), listDeliverables(projectId)]);
      setPhases(p);
      setDeliverables(d);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deliverablesByPhase = (phaseId: number) => deliverables.filter(d => d.phaseId === phaseId);

  // Phase CRUD
  const openPhaseForm = (phase?: PhaseDto) => {
    if (phase) {
      setEditingPhase(phase);
      setPhaseForm({ name: phase.name, description: phase.description || '', startDate: phase.startDate || '', endDate: phase.endDate || '' });
    } else {
      setEditingPhase(null);
      setPhaseForm({ name: '', description: '', startDate: '', endDate: '' });
    }
    setPhaseError(null);
    setShowPhaseForm(true);
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseForm.name.trim()) return;
    setPhaseSaving(true); setPhaseError(null);
    try {
      if (editingPhase) {
        await updatePhase(projectId, editingPhase.id, {
          name: phaseForm.name, description: phaseForm.description || undefined,
          startDate: phaseForm.startDate || undefined, endDate: phaseForm.endDate || undefined,
        });
      } else {
        await createPhase(projectId, {
          name: phaseForm.name, description: phaseForm.description || undefined,
          startDate: phaseForm.startDate || undefined, endDate: phaseForm.endDate || undefined,
        });
      }
      setShowPhaseForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save phase:', err);
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save phase.';
      setPhaseError(msg);
    } finally { setPhaseSaving(false); }
  };

  const handlePhaseDelete = async (id: number) => {
    if (!confirm('Delete this phase and all its deliverables?')) return;
    await deletePhase(projectId, id);
    fetchData();
  };

  // Deliverable CRUD
  const openDeliverableForm = (phaseId: number, deliverable?: DeliverableDto) => {
    if (deliverable) {
      setEditingDeliverable(deliverable);
      setDeliverableForm({ name: deliverable.name, description: deliverable.description || '', phaseId, dueDate: deliverable.dueDate || '', state: deliverable.state });
    } else {
      setEditingDeliverable(null);
      setDeliverableForm({ name: '', description: '', phaseId, dueDate: '', state: 'DRAFT' });
    }
    setDeliverableError(null);
    setShowDeliverableForm(true);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableForm.name.trim()) return;
    setDeliverableSaving(true); setDeliverableError(null);
    try {
      if (editingDeliverable) {
        await updateDeliverable(projectId, editingDeliverable.id, {
          name: deliverableForm.name, description: deliverableForm.description || undefined,
          state: deliverableForm.state, dueDate: deliverableForm.dueDate || undefined,
        });
      } else {
        await createDeliverable(projectId, {
          name: deliverableForm.name, description: deliverableForm.description || undefined,
          phaseId: deliverableForm.phaseId, dueDate: deliverableForm.dueDate || undefined,
        });
      }
      setShowDeliverableForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save deliverable:', err);
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save deliverable.';
      setDeliverableError(msg);
    } finally { setDeliverableSaving(false); }
  };

  const handleDeliverableDelete = async (id: number) => {
    if (!confirm('Delete this deliverable?')) return;
    await deleteDeliverable(projectId, id);
    fetchData();
  };

  const handleStateChange = async (deliverable: DeliverableDto, newState: DeliverableDto['state']) => {
    await updateDeliverable(projectId, deliverable.id, { state: newState });
    fetchData();
  };

  const nextDeliverableState = (state: DeliverableDto['state']): DeliverableDto['state'] | null => {
    if (state === 'DRAFT') return 'DELIVERED';
    if (state === 'DELIVERED') return 'VALIDATED';
    return null;
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Phases ({phases.length})</h3>
        {canEdit && (
          <button onClick={() => openPhaseForm()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">+ Add Phase</button>
        )}
      </div>

      {phases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No phases defined yet.</div>
      ) : (
        <div className="space-y-3">
          {phases.map(phase => {
            const isExpanded = expandedPhaseId === phase.id;
            const phaseDeliverables = deliverablesByPhase(phase.id);
            return (
              <div key={phase.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <h4 className="font-medium text-gray-900">{phase.name}</h4>
                      {phaseDeliverables.length > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">{phaseDeliverables.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {(phase.startDate || phase.endDate) && (
                        <span className="text-xs text-gray-400">
                          {phase.startDate && formatDate(phase.startDate)}
                          {phase.startDate && phase.endDate && ' → '}
                          {phase.endDate && formatDate(phase.endDate)}
                        </span>
                      )}
                      {canEdit && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openPhaseForm(phase)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handlePhaseDelete(phase.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {phase.description && <p className="text-sm text-gray-500 mt-1 ml-7">{phase.description}</p>}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-2 ml-7">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deliverables ({phaseDeliverables.length})</span>
                      {canEdit && (
                        <button onClick={() => openDeliverableForm(phase.id)} className="text-xs font-medium text-primary-600 hover:text-primary-800">+ Add</button>
                      )}
                    </div>
                    {phaseDeliverables.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No deliverables yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {phaseDeliverables.map(d => (
                          <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => {
                                  const next = nextDeliverableState(d.state);
                                  if (next && canEdit) handleStateChange(d, next);
                                }}
                                disabled={!canEdit || !nextDeliverableState(d.state)}
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${deliverableStateBadge(d.state)} ${canEdit && nextDeliverableState(d.state) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                title={nextDeliverableState(d.state) ? `Change to ${deliverableStateLabel(nextDeliverableState(d.state)!)}` : undefined}
                              >
                                {deliverableStateLabel(d.state)}
                              </button>
                              <span className="text-sm text-gray-900 truncate">{d.name}</span>
                              {d.dueDate && <span className="text-xs text-gray-400">Due: {formatDate(d.dueDate)}</span>}
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => openDeliverableForm(phase.id, d)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                                <button onClick={() => handleDeliverableDelete(d.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase form modal */}
      {showPhaseForm && (
        <Modal title={editingPhase ? 'Edit Phase' : 'New Phase'} onClose={() => setShowPhaseForm(false)}>
          <form onSubmit={handlePhaseSubmit} className="space-y-4">
            {phaseError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{phaseError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={phaseForm.description} onChange={e => setPhaseForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={phaseForm.startDate} onChange={e => setPhaseForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={phaseForm.endDate} onChange={e => setPhaseForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPhaseForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={phaseSaving || !phaseForm.name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {phaseSaving && <Spinner className="h-4 w-4" />}{editingPhase ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deliverable form modal */}
      {showDeliverableForm && (
        <Modal title={editingDeliverable ? 'Edit Deliverable' : 'New Deliverable'} onClose={() => setShowDeliverableForm(false)}>
          <form onSubmit={handleDeliverableSubmit} className="space-y-4">
            {deliverableError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{deliverableError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={deliverableForm.name} onChange={e => setDeliverableForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={deliverableForm.description} onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {!editingDeliverable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select value={deliverableForm.phaseId} onChange={e => setDeliverableForm(f => ({ ...f, phaseId: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {editingDeliverable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select value={deliverableForm.state} onChange={e => setDeliverableForm(f => ({ ...f, state: e.target.value as DeliverableDto['state'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="DRAFT">Draft</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="VALIDATED">Validated</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={deliverableForm.dueDate} onChange={e => setDeliverableForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeliverableForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={deliverableSaving || !deliverableForm.name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {deliverableSaving && <Spinner className="h-4 w-4" />}{editingDeliverable ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}