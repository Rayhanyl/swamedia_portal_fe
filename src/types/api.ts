// Envelope yang membungkus SEMUA response backend swamedia_portal_be
// (sukses maupun error). Payload sesungguhnya selalu ada di `data`.

// Field & namanya persis documentation/note/api/README.md#paginasi
// ("page", "limit", "totalItems", "totalPages") — bukan "perPage"/"total".
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
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
