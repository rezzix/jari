import client from './client';
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type {
  UserDto,
  ProgramDto,
  CreateProgramRequest,
  UpdateProgramRequest,
  OrganizationConfig,
  IssueTypeDto,
  IssueStatusDto,
  OrganizationUpdateRequest,
  CreateUserRequest,
  AdminUpdateUserRequest,
  CreateIssueTypeRequest,
  CreateIssueStatusRequest,
} from '@/types';

// Users
export async function listUsers(params?: Record<string, string | number>) {
  const res = await apiGetPaginated<UserDto>('/users', { size: 100, ...params });
  return res;
}

export async function createUser(request: CreateUserRequest): Promise<UserDto> {
  return apiPost<UserDto>('/users', request);
}

export async function adminUpdateUser(id: number, request: AdminUpdateUserRequest): Promise<UserDto> {
  return apiPut<UserDto>(`/users/${id}`, request);
}

export async function deactivateUser(id: number): Promise<void> {
  await apiDelete(`/users/${id}`);
}

// Programs
export async function listPrograms(params?: Record<string, string | number>) {
  const res = await apiGetPaginated<ProgramDto>('/programs', { size: 100, ...params });
  return res;
}

export async function createProgram(request: CreateProgramRequest): Promise<ProgramDto> {
  return apiPost<ProgramDto>('/programs', request);
}

export async function updateProgram(id: number, request: UpdateProgramRequest): Promise<ProgramDto> {
  return apiPut<ProgramDto>(`/programs/${id}`, request);
}

export async function deleteProgram(id: number): Promise<void> {
  await apiDelete(`/programs/${id}`);
}

// Organization
export async function getOrganization(): Promise<OrganizationConfig> {
  return apiGet<OrganizationConfig>('/organization');
}

export async function updateOrganization(request: OrganizationUpdateRequest): Promise<OrganizationConfig> {
  return apiPut<OrganizationConfig>('/organization', request);
}

// Issue Types (returns raw array, no ApiResponse envelope)
export async function listIssueTypes(): Promise<IssueTypeDto[]> {
  const res = await client.get<IssueTypeDto[]>('/issue-types');
  return res.data;
}

export async function createIssueType(request: CreateIssueTypeRequest): Promise<IssueTypeDto> {
  const res = await client.post<IssueTypeDto>('/issue-types', request);
  return res.data;
}

export async function updateIssueType(id: number, request: CreateIssueTypeRequest): Promise<IssueTypeDto> {
  const res = await client.put<IssueTypeDto>(`/issue-types/${id}`, request);
  return res.data;
}

export async function deleteIssueType(id: number): Promise<void> {
  await client.delete(`/issue-types/${id}`);
}

// Issue Statuses (returns raw array, no ApiResponse envelope)
export async function listIssueStatuses(): Promise<IssueStatusDto[]> {
  const res = await client.get<IssueStatusDto[]>('/issue-statuses');
  return res.data;
}

export async function createIssueStatus(request: CreateIssueStatusRequest): Promise<IssueStatusDto> {
  const res = await client.post<IssueStatusDto>('/issue-statuses', request);
  return res.data;
}

export async function updateIssueStatus(id: number, request: CreateIssueStatusRequest): Promise<IssueStatusDto> {
  const res = await client.put<IssueStatusDto>(`/issue-statuses/${id}`, request);
  return res.data;
}

export async function deleteIssueStatus(id: number): Promise<void> {
  await client.delete(`/issue-statuses/${id}`);
}