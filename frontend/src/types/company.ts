export interface CompanyDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
  active?: boolean;
}