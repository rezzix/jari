import { apiGet } from './client';
import type { OrganizationConfig, PublicConfigResponse } from '@/types';

export async function getOrganization(): Promise<OrganizationConfig> {
  return apiGet<OrganizationConfig>('/organization');
}

export async function getPublicOrganization(): Promise<PublicConfigResponse | null> {
  try {
    return await apiGet<PublicConfigResponse>('/organization/public');
  } catch {
    return null;
  }
}