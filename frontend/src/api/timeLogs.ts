import client from './client';
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { TimeLogDto, CreateTimeLogRequest, UpdateTimeLogRequest } from '@/types';

export async function listTimeLogs(params?: Record<string, string | number>): Promise<TimeLogDto[]> {
  const res = await apiGetPaginated<TimeLogDto>('/time-logs', { size: 100, ...params });
  return res.data;
}

export async function createTimeLog(request: CreateTimeLogRequest): Promise<TimeLogDto> {
  return apiPost<TimeLogDto>('/time-logs', request);
}

export async function updateTimeLog(id: number, request: UpdateTimeLogRequest): Promise<TimeLogDto> {
  return apiPut<TimeLogDto>(`/time-logs/${id}`, request);
}

export async function deleteTimeLog(id: number): Promise<void> {
  await apiDelete(`/time-logs/${id}`);
}

export async function getWeeklyTimesheet(userId: number, weekStart: string): Promise<{
  userId: number;
  weekStart: string;
  weekEnd: string;
  days: Record<string, TimeLogDto[]>;
}> {
  const res = await client.get('/timesheets/weekly', { params: { userId, weekStart } });
  return res.data.data;
}