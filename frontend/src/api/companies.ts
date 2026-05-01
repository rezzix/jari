import { apiGet, apiGetPaginated, apiPost, apiPut } from './client';
import type { CompanyDto, CreateCompanyRequest, UpdateCompanyRequest } from '@/types';

export async function listCompanies(params?: Record<string, string | number>) {
  const res = await apiGetPaginated<CompanyDto>('/companies', { size: 100, ...params });
  return res;
}

export async function getCompany(id: number): Promise<CompanyDto> {
  return apiGet<CompanyDto>(`/companies/${id}`);
}

export async function createCompany(request: CreateCompanyRequest): Promise<CompanyDto> {
  return apiPost<CompanyDto>('/companies', request);
}

export async function updateCompany(id: number, request: UpdateCompanyRequest): Promise<CompanyDto> {
  return apiPut<CompanyDto>(`/companies/${id}`, request);
}