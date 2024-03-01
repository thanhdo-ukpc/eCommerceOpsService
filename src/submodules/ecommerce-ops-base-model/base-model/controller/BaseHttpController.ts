import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CountProps, FindProps, ListProps, Paging } from '..';
import { IBaseController } from './IBaseController';

export class BaseHttpController<T> implements IBaseController<T> {
    protected serviceURL: string;
    protected basePath: string;
    protected client: AxiosInstance;

    public constructor(serviceURL: string, basePath: string, client: AxiosInstance) {
        this.serviceURL = serviceURL;
        this.basePath = basePath;
        this.client = client;
    }

    async upsert(t: Partial<T>): Promise<T> {
        return this.client.post(`${this.serviceURL}/${this.basePath}`, t).then((res) => {
            return res.data;
        });
    }
    async find(params: FindProps<T>): Promise<T[]> {
        return this.client
            .get(`${this.serviceURL}/${this.basePath}/find`, {
                params: params,
            })
            .then((res) => {
                return res.data;
            });
    }

    async list(params: ListProps<T>): Promise<Paging<T>> {
        params = { ...params };
        return this.client.post(`${this.serviceURL}/${this.basePath}/filter`, { ...params }).then((res) => {
            return res.data;
        });
    }

    async get(id: string): Promise<T> {
        return this.client.get(`${this.serviceURL}/${this.basePath}/${id}`).then((res) => {
            return res.data;
        });
    }

    async delete(id: string): Promise<T> {
        return this.client.delete(`${this.serviceURL}/${this.basePath}/${id}`).then((res) => {
            return res.data;
        });
    }

    async create(t: T): Promise<T> {
        return this.client.post(`${this.serviceURL}/${this.basePath}`, t).then((res) => {
            return res.data;
        });
    }

    async count(params: CountProps<T>): Promise<number> {
        return this.client
            .get(`${this.serviceURL}/${this.basePath}/count`, {
                params: params,
            })
            .then((res) => {
                return res.data;
            });
    }

    findOne(props: Omit<FindProps<T>, 'limit'>): Promise<T> {
        return this.doPost({ path: 'findOne', body: props }).then((res) => res.data);
    }
    upsertAndGetList(props: { t: T; listFilter: ListProps<T> }): Promise<Paging<T>> {
        return this.doPost({ path: 'upsertAndGetList', body: props }).then((res) => res.data);
    }
    deleteAndGetList(props: { id: string; listFilter: ListProps<T> }): Promise<Paging<T>> {
        return this.doPost({ path: 'deleteAndGetList', body: props }).then((res) => res.data);
    }

    async bulkUpsert(props: { list: T[] }): Promise<T[]> {
        const res = await this.doPost({ path: 'bulk-upsert', body: props });
        return res.data;
    }

    doGet({ path, config }: { path: string; config?: AxiosRequestConfig }) {
        return this.client.get(`${this.serviceURL}/${this.basePath}/${path}`, config);
    }

    doPost({ path, body, config }: { path: string; body?: any; config?: AxiosRequestConfig }) {
        return this.client.post(`${this.serviceURL}/${this.basePath}/${path}`, body, config);
    }

    doPut({ path, body, config }: { path: string; body?: any; config?: AxiosRequestConfig }) {
        return this.client.put(`${this.serviceURL}/${this.basePath}/${path}`, body, config);
    }

    doPatch({ path, body, config }: { path: string; body?: any; config?: AxiosRequestConfig }) {
        return this.client.patch(`${this.serviceURL}/${this.basePath}/${path}`, body, config);
    }

    doDelete({ path, config }: { path: string; body?: any; config?: AxiosRequestConfig }) {
        return this.client.delete(`${this.serviceURL}/${this.basePath}/${path}`, config);
    }
}
