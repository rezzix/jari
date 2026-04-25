export interface SprintDto {
  id: number;
  name: string;
  goal: string | null;
  projectId: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}