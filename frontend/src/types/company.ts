export interface CompanyDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  address: string | null;
  website: string | null;
  logo: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  key: string;
  description?: string;
  address?: string;
  website?: string;
  logo?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
  address?: string;
  website?: string;
  logo?: string;
  active?: boolean;
}