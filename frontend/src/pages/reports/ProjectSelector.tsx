import { useState, useEffect } from 'react';
import { listProjects } from '@/api/projects';
import type { ProjectDto } from '@/types';

export default function ProjectSelector({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  useEffect(() => { listProjects().then(setProjects); }, []);
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="">Select project</option>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
    </select>
  );
}