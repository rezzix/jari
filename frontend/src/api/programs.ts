import { apiGet, apiGetPaginated } from './client';
import type { ProgramDto } from '@/types';

export function listPrograms(params?: Record<string, string | number>) {
  return apiGetPaginated<ProgramDto>('/programs', params);
}

export function getProgram(id: number) {
  return apiGet<ProgramDto>(`/programs/${id}`);
}