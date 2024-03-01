import { BaseModel, FindProps, ListProps, Paging, CountProps } from '@Core';
import { BaseRepository } from './BaseRepository';
import { IBaseController } from './IBaseController';

export class BaseService<T extends BaseModel, R extends BaseRepository<T> = BaseRepository<T>>
    implements IBaseController<T>
{
    repository: R;
    constructor(repository: R) {
        this.repository = repository;
    }
    bulkUpsert(props: { list: T[] }): Promise<T[]> {
        return this.repository.bulkUpsert(props.list);
    }
    findOne(props: Omit<FindProps<T>, 'limit'>): Promise<T> {
        return this.repository.findOne(props);
    }
    get(id: number): Promise<T> {
        return this.repository.get(id);
    }
    upsert(t: Partial<T>): Promise<T> {
        return this.repository.upsert(t as T);
    }
    delete(id: number): Promise<T> {
        return this.repository.delete(id);
    }
    list(props: ListProps<T>): Promise<Paging<T>> {
        return this.repository.list(props);
    }
    find(props: FindProps<T>): Promise<T[]> {
        return this.repository.find(props);
    }
    count(props: CountProps<T>): Promise<number> {
        return this.repository.count(props);
    }
    upsertAndGetList(props: { t: T; listFilter: ListProps<T> }): Promise<Paging<T>> {
        return this.repository.upsertAndGetList(props);
    }
    deleteAndGetList(props: { id: number; listFilter: ListProps<T> }): Promise<Paging<T>> {
        return this.repository.deleteAndGetList(props);
    }
}
