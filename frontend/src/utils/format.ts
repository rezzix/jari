import type { IssuePriority } from '@/types';

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const priorityColors: Record<IssuePriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
};

export function priorityColor(priority: IssuePriority): string {
  return priorityColors[priority] ?? 'bg-gray-100 text-gray-700';
}

export function statusColor(statusName: string): string {
  const s = statusName.toLowerCase();
  if (s.includes('done') || s.includes('complete')) return 'bg-green-100 text-green-700';
  if (s.includes('progress') || s.includes('active')) return 'bg-blue-100 text-blue-700';
  if (s.includes('todo') || s.includes('open')) return 'bg-gray-100 text-gray-700';
  if (s.includes('review')) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
}