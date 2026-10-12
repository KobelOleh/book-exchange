/** One page of a larger list, with the total so clients can build a pager. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const DEFAULT_PAGE_LIMIT = 12;
export const MAX_PAGE_LIMIT = 100;
