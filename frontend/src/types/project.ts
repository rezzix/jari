export interface ProjectDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  programId: number | null;
  programName: string | null;
  managerId: number;
  managerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  programId: number;
  managerId: number;
  memberIds?: number[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  managerId?: number;
}

export interface MemberDto {
  id: number;
  userId: number;
  username: string;
  fullName: string;
}

export interface LabelDto {
  id: number;
  name: string;
  color: string;
}

export interface LabelCreateRequest {
  name: string;
  color: string;
}

export interface BoardColumnDto {
  id: number;
  statusId: number;
  name: string;
  position: number;
  issueCount: number;
}

export interface BoardConfigDto {
  projectId: number;
  columns: BoardColumnDto[];
}

export interface BoardUpdateRequest {
  columns: { statusId: number; position: number }[];
}