export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  status: 422;
  error: 'Validation Failed';
  errors: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}