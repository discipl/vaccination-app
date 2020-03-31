class Pagination {
  count: number;
}

export class PaginationResponse<T> {
  pagination: Pagination;
  items: T[];
}
