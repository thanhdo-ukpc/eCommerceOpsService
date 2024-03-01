import { ListProps, Paging, FindProps, CountProps } from "@Core";

export interface IBaseService<T> {
    get(id: number): Promise<T>;
    upsert(t: T): Promise<T>;
    delete(id: number): Promise<T>;
    list(props: ListProps<T>): Promise<Paging<T>>;
    find(props: FindProps<T>): Promise<T[]>;
    count(props: CountProps<T>): Promise<number>;
}
