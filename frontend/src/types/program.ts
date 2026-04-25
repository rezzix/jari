export interface ProgramDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  managerId: number;
  managerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  key: string;
  description?: string;
  managerId: number;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  managerId?: number;
}