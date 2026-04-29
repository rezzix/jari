import { useState } from 'react';
import type { ProjectDto } from '@/types';
import { updateProject } from '@/api/projects';
import { extractValidationErrors } from '@/api/client';
import EvmCard from './EvmCard';

export default function SettingsTab({ project, onUpdate }: { project: ProjectDto; onUpdate: (p: ProjectDto) => void }) {
  const [stage, setStage] = useState(project.stage || 'INITIATION');
  const [strategicScore, setStrategicScore] = useState(project.strategicScore?.toString() || '');
  const [plannedValue, setPlannedValue] = useState(project.plannedValue || '');
  const [budget, setBudget] = useState(project.budget || '');
  const [budgetSpent, setBudgetSpent] = useState(project.budgetSpent || '');
  const [targetStartDate, setTargetStartDate] = useState(project.targetStartDate || '');
  const [targetEndDate, setTargetEndDate] = useState(project.targetEndDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (strategicScore && (Number(strategicScore) < 1 || Number(strategicScore) > 10)) {
      errors.strategicScore = 'Strategic score must be between 1 and 10';
    }
    if (plannedValue && isNaN(Number(plannedValue))) {
      errors.plannedValue = 'Planned value must be a number';
    }
    if (budget && isNaN(Number(budget))) {
      errors.budget = 'Budget must be a number';
    }
    if (budgetSpent && isNaN(Number(budgetSpent))) {
      errors.budgetSpent = 'Budget spent must be a number';
    }
    if (targetStartDate && targetEndDate && targetEndDate < targetStartDate) {
      errors.targetEndDate = 'End date must be after start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(null); setSuccess(false);
    try {
      const updated = await updateProject(project.id, {
        stage, strategicScore: strategicScore ? Number(strategicScore) : null,
        plannedValue: plannedValue || null, budget: budget || null,
        budgetSpent: budgetSpent || null,
        targetStartDate: targetStartDate || null, targetEndDate: targetEndDate || null,
      });
      onUpdate(updated);
      setSuccess(true);
    } catch (err) {
      const serverErrors = extractValidationErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        setError('Failed to save project settings.');
      }
    } finally { setSaving(false); }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${fieldErrors[field] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`;

  return (
    <div className="space-y-6">
      <EvmCard projectId={project.id} />

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">Settings saved.</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select value={stage} onChange={e => setStage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="INITIATION">Initiation</option>
              <option value="PLANNING">Planning</option>
              <option value="EXECUTION">Execution</option>
              <option value="CLOSING">Closing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strategic Score (1-10)</label>
            <input type="number" min="1" max="10" value={strategicScore} onChange={e => setStrategicScore(e.target.value)} placeholder="e.g. 7" className={inputClass('strategicScore')} />
            {fieldErrors.strategicScore && <p className="mt-1 text-sm text-red-600">{fieldErrors.strategicScore}</p>}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-700 pt-2 border-t border-gray-100">Budget &amp; EVM</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planned Value (PV Baseline)</label>
            <input type="text" value={plannedValue} onChange={e => setPlannedValue(e.target.value)} placeholder="e.g. 150000" className={inputClass('plannedValue')} />
            {fieldErrors.plannedValue && <p className="mt-1 text-sm text-red-600">{fieldErrors.plannedValue}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
            <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 150000" className={inputClass('budget')} />
            {fieldErrors.budget && <p className="mt-1 text-sm text-red-600">{fieldErrors.budget}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Spent (Non-Labor)</label>
            <input type="text" value={budgetSpent} onChange={e => setBudgetSpent(e.target.value)} placeholder="e.g. 12000" className={inputClass('budgetSpent')} />
            {fieldErrors.budgetSpent && <p className="mt-1 text-sm text-red-600">{fieldErrors.budgetSpent}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Start Date</label>
            <input type="date" value={targetStartDate} onChange={e => setTargetStartDate(e.target.value)} className={inputClass('targetStartDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target End Date</label>
            <input type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} className={inputClass('targetEndDate')} />
            {fieldErrors.targetEndDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.targetEndDate}</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}