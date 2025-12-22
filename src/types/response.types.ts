// API Response types based on API spec
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  code: number;
  data: T;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown[];
}

export interface ApiMessage {
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
