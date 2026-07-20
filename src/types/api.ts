// Envelope yang membungkus SEMUA response backend swamedia_portal_be
// (sukses maupun error). Payload sesungguhnya selalu ada di `data`.

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: ApiError | null;
  meta: {
    timestamp: string;
    pagination?: Pagination;
  };
}
