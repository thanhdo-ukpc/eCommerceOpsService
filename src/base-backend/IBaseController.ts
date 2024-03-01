import { ListProps, Paging, FindProps, CountProps } from "@Core";

export interface IBaseController<T> {
    get(id: number): Promise<T | undefined>;
    upsert(t: Partial<T>): Promise<T>;
    delete(id: number): Promise<T | undefined>;
    list(props: ListProps<T>): Promise<Paging<T>>;
    find(props: FindProps<T>): Promise<T[]>;
    findOne(props: Omit<FindProps<T>, 'limit'>): Promise<T>;
    count(props: CountProps<T>): Promise<number>;
    bulkUpsert(props: { list: T[] }): Promise<T[]>;
}
