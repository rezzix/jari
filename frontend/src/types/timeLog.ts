export interface TimeLogDto {
  id: number;
  hours: number;
  logDate: string;
  description: string | null;
  issueId: number;
  issueKey: string;
  issueTitle: string;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeLogRequest {
  issueId: number;
  hours: number;
  logDate: string;
  description?: string;
}

export interface UpdateTimeLogRequest {
  hours?: number;
  logDate?: string;
  description?: string;
}