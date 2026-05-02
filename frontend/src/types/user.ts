export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'EXECUTIVE' | 'EXTERNAL';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number | null;
  companyName: string | null;
  assignedProjectId: number | null;
  assignedProjectName: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}