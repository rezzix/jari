export interface ProgramDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  managerId: number;
  managerName: string;
  companyId: number | null;
  companyName: string | null;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  key: string;
  description?: string;
  managerId: number;
  companyId?: number | null;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  managerId?: number;
}