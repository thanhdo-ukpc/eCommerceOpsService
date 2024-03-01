export class Paging<T> {
    rows: T[] = [];
    total: number = 0;
    page: number = 1;
    pageSize: number = DEFAULT_PAGE_SIZE;
    totalPages: number = 0;
}

export const DEFAULT_PAGE_SIZE = 10;
export function defaultPagination<T>(): Paging<T> {
    return new Paging();
}
