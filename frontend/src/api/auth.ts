import { apiGet, apiPost } from './client';
import type { UserDto, LoginRequest } from '@/types';

export async function login(request: LoginRequest): Promise<UserDto> {
  return apiPost<UserDto>('/auth/login', request);
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

export async function me(): Promise<UserDto> {
  return apiGet<UserDto>('/auth/me');
}

export async function getCaptcha(): Promise<{ question: string }> {
  return apiGet<{ question: string }>('/auth/captcha');
}