import { listRaidItems } from '@/api/pmo';
import { formatCurrency } from '@/utils/format';
import type { RaidItemDto, ProjectDto } from '@/types';

export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

export function filterMyProjects(projects: ProjectDto[], userId: number): ProjectDto[] {
  return projects.filter((p) => p.managerId === userId);
}

export async function aggregateRaidItems(
  projectIds: number[],
  type?: string,
): Promise<RaidItemDto[]> {
  const results = await Promise.all(
    projectIds.map((id) => listRaidItems(id, type).catch(() => [] as RaidItemDto[])),
  );
  return results.flat().sort((a, b) => b.riskScore - a.riskScore);
}

export function formatKpiValue(value: number | null, type: 'currency' | 'percent' | 'count'): string {
  if (value == null) return '—';
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return (value * 100).toFixed(1) + '%';
    case 'count':
      return value.toLocaleString('en-US');
  }
}