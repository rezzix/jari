import { apiGet } from './client';
import type { OrganizationConfig } from '@/types';

export async function getOrganization(): Promise<OrganizationConfig> {
  return apiGet<OrganizationConfig>('/organization');
}

export async function getPublicOrganization(): Promise<OrganizationConfig | null> {
  try {
    return await apiGet<OrganizationConfig>('/organization/public');
  } catch {
    return null;
  }
}