import { Paging } from '@Core';

export class PaginationHelper {
    serverPaging<T>(props: { fullRows: T[]; page?: number; pageSize?: number }): Paging<T> {
        if (!props.page) props.page = 1;
        if (!props.pageSize) props.pageSize = 50;

        const { fullRows, page, pageSize } = props;

        const total = fullRows.length;
        const totalPages = Math.ceil(total / pageSize);

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const rows = total > 0 ? fullRows.slice(startIndex, endIndex) : [];

        return { page, pageSize, total, totalPages, rows };
    }
}

export const paginationHelper = new PaginationHelper();
