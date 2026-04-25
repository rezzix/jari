import { apiGet } from './client';
import type { OrganizationConfig } from '@/types';

export async function getOrganization(): Promise<OrganizationConfig> {
  return apiGet<OrganizationConfig>('/organization');
}