import { CountProps, FindProps, ListProps, Paging } from '@Core';

export interface IBaseController<T> {
    get(id: string): Promise<T | undefined>;
    upsert(t: Partial<T>): Promise<T>;
    delete(id: string): Promise<T | undefined>;
    list(props: ListProps<T>): Promise<Paging<T>>;
    find(props: FindProps<T>): Promise<T[]>;
    findOne(props: Omit<FindProps<T>, 'limit'>): Promise<T>;
    count(props: CountProps<T>): Promise<number>;
    bulkUpsert(props: { list: T[] }): Promise<T[]>;
}
