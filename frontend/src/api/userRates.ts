import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { UserRateDto } from '@/types';

export function getUserRates(userId: number): Promise<UserRateDto[]> {
  return apiGet(`/user-rates/user/${userId}`);
}

export function createUserRate(data: { userId: number; hourlyRate: number; effectiveFrom: string }): Promise<UserRateDto> {
  return apiPost('/user-rates', data);
}

export function updateUserRate(id: number, data: { hourlyRate?: number; effectiveFrom?: string }): Promise<UserRateDto> {
  return apiPut(`/user-rates/${id}`, data);
}

export function deleteUserRate(id: number): Promise<void> {
  return apiDelete(`/user-rates/${id}`);
}