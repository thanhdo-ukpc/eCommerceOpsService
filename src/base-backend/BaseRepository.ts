import { BaseListProps, BaseModel, CountProps, FindProps, ListProps, Paging, Query, TypeKey } from '@Core';
import * as _ from 'lodash';
import { head } from 'lodash';
import {
    Association,
    BulkCreateOptions,
    CountOptions,
    FindAndCountOptions,
    FindOptions,
    Includeable,
    IncludeOptions,
    Model,
    ModelStatic,
    Op,
    OrderItem as OrderItemSequelize,
    Sequelize,
    WhereOptions,
} from 'sequelize';
export enum AssociationType {
    BelongsToMany = 'BelongsToMany',
    HasMany = 'HasMany',
}

import { IBaseService } from './IBaseService';

export class BaseRepository<T extends BaseModel> implements IBaseService<T> {
    model: ModelStatic<Model<T, T>>;
    getInclude?: Includeable[] = [];
    setInclude?: Includeable[] = [];
    connector: Sequelize;

    constructor(connector: Sequelize, model: ModelStatic<Model<T, T>>) {
        this.model = model;
        this.connector = connector;
    }
    async upsertAndGetList(props: { t: T; listFilter: ListProps<T> }): Promise<Paging<T>> {
        await this.upsert(props.t);
        return this.list(props.listFilter);
    }
    async deleteAndGetList(props: { id: number; listFilter: ListProps<T> }): Promise<Paging<T>> {
        await this.delete(props.id);
        return this.list(props.listFilter);
    }

    async bulkUpsert(listT: T[], options: BulkCreateOptions = {}): Promise<T[]> {
        let upsertFields = Object.keys(this.model.rawAttributes);
        upsertFields = upsertFields.filter((f) => f != 'id');
        const newValue = await this.model.bulkCreate(
            listT as any,
            {
                updateOnDuplicate: upsertFields,
                ...(options || {}),
            } as BulkCreateOptions
        );
        return JSON.parse(JSON.stringify(newValue));
    }

    async get(id: number, options: FindOptions = {}, include?: Includeable[]): Promise<T> {
        let result = await this.model.findOne({ where: { id }, include: include || this.getInclude, ...options });
        if (result) return result.get({ plain: true, clone: true });
        return null;
    }

    async getByIds(ids: string[], options: FindOptions = {}): Promise<T[]> {
        let result = await this.model.findAll({
            where: { id: { [Op.in]: _.uniq(ids) } },
            include: this.getInclude,
            ...options,
        });
        if (result) return JSON.parse(JSON.stringify(result));
        return [];
    }

    async upsert(t: T): Promise<T> {
        const newObject = await this.upsertWithInclude(t, this.model, this.setInclude);
        return this.get(newObject.Id);
    }

    private async upsertWithInclude<P>(object: P, model: ModelStatic<Model>, includes: Includeable[]): Promise<P> {
        const newOject = await model.upsert(object as any);
        const associations = this.getAssociations(model);
        await Promise.all(
            includes.map(async (include: IncludeOptions) => {
                const association = associations.find((a) => a.as == include.as);
                if (!association) return;
                await this.upsertBelongToMany(
                    object,
                    include.as,
                    association.source,
                    association.target,
                    (association as any).through.model
                );
                if (include.include) {
                    let includeObjects: any[] = object[include.as];
                    includeObjects = Array.isArray(includeObjects) ? includeObjects : [includeObjects];
                    includeObjects = includeObjects.filter((i) => !!i);
                    if (!includeObjects || includeObjects.length == 0) return;
                    await Promise.all(
                        includeObjects.map(
                            async (object) =>
                                await this.upsertWithInclude(
                                    object,
                                    include.model as ModelStatic<Model>,
                                    include.include
                                )
                        )
                    );
                }
            })
        );
        return newOject[0].get();
    }

    private async upsertBelongToMany<P extends BaseModel>(
        object: P,
        key: string,
        source: ModelStatic<Model>,
        target: ModelStatic<Model>,
        through: ModelStatic<Model>
    ) {
        try {
            await source.upsert({ ...object, deletedAt: null } as any);
        } catch (error) {}
        if (!object[key]) return;
        let targetObjects: BaseModel[] = Array.isArray(object[key]) ? object[key] : [object[key]];
        const throughAttrs = Object.keys(through.rawAttributes).map((key) => through.rawAttributes[key]);
        const throughSourceAttr = throughAttrs.find((attr) => (attr.references as any)?.model == source.name);
        const throughTargetAttr = throughAttrs.find((attr) => (attr.references as any)?.model == target.name);
        await through.destroy({ where: { [throughSourceAttr.field]: object.Id } });
        await through.bulkCreate(
            targetObjects.map((targetObject) => ({
                ...targetObject,
                [throughSourceAttr.field]: object.Id,
            }))
        );
    }

    private async findAndCountAll(props: FindAndCountOptions<T>): Promise<{ rows: T[]; count: number }> {
        const [rows, count] = await Promise.all([this.find({}, props), this.count({}, props)]);
        return { rows, count };
    }

    async list(props: ListProps<T>, option?: FindAndCountOptions<T>): Promise<Paging<T>> {
        let propsClean = this.defaultPropsListProps(props);
        const { filter, page, pageSize } = propsClean;
        const { rows, count } = await this.model.findAndCountAll({
            distinct: true,
            where: this.buildQuery(props),
            limit: pageSize || 20,
            offset: (page - 1) * pageSize,
            order: this.buildSort(propsClean.sorts),
            include: this.getInclude,
            ...option,
        });

        const dataResults = JSON.parse(JSON.stringify(rows)) as T[];

        return {
            page,
            pageSize,
            total: count,
            totalPages: Math.ceil(count / pageSize),
            rows: dataResults,
        };
    }

    async listWithScope(params: {
        listProps: ListProps<T>;
        scope: string;
        options?: FindAndCountOptions<T>;
    }): Promise<Paging<T>> {
        const { listProps, scope, options } = params;

        const propsClean = this.defaultPropsListProps(listProps);
        const { page, pageSize } = propsClean;

        const { rows, count } = await this.model.scope(scope).findAndCountAll({
            distinct: true,
            where: this.buildQuery(listProps),
            limit: pageSize || 20,
            offset: (page - 1) * pageSize,
            order: this.buildSort(propsClean.sorts),
            include: this.getInclude,
            ...options,
        });

        const dataResults = JSON.parse(JSON.stringify(rows)) as T[];

        return {
            page,
            pageSize,
            total: count,
            totalPages: Math.ceil(count / pageSize),
            rows: dataResults,
        };
    }

    find(props: FindProps<T>, option?: FindOptions): Promise<T[]> {
        let propsClean = this.defaultPropsListProps(props);
        return this.model
            .findAll({
                where: this.buildQuery(props),
                limit: props.limit || 10000,
                offset: props.offset || 0,
                order: this.buildSort(propsClean.sorts),
                include: this.getInclude,
                ...option,
            })
            .then((res) => res.map((i) => i.get()));
    }
    findOne(props: BaseListProps<T>, option?: FindOptions): Promise<T | null> {
        return this.find(props, option).then(head);
    }

    count(props: CountProps<T>, option?: Omit<CountOptions<T>, 'group'>): Promise<number> {
        const propsCount = {
            ..._.omit(props, ['order', 'offset', 'limit']),
            include: !Array.isArray(option.include)
                ? option.include
                : option.include.filter((i: any) => {
                      return i.required == true;
                  }),
        };
        return this.model.count({
            where: this.buildQuery(props),
            ...propsCount,
            ...option,
        });
    }

    async delete(id: number): Promise<T> {
        const associations = this.getAssociations(this.model, AssociationType.BelongsToMany);
        await Promise.all(
            associations.map(async (a) => {
                const relationModel: ModelStatic<Model> = (a as any).through.model;
                const foreignKey = a.foreignKey;
                await relationModel.destroy({ where: { [foreignKey]: id } });
            })
        );

        await this.model.destroy({ where: { Id: id } });
        return Promise.resolve({} as T);
    }

    private getAssociations(model: ModelStatic<Model>, type?: AssociationType): Association[] {
        let keys = Object.keys(model.associations);
        let associations = keys.map((key) => model.associations[key]);
        if (type) return associations.filter((a) => a.associationType == type);
        return associations;
    }
    // build query
    private buildSort(sort: TypeKey<BaseListProps<T>, 'sorts'>): OrderItemSequelize[] {
        return sort && sort.length
            ? sort.map((s) => {
                  if (typeof s == 'function') {
                      return s as any;
                  }
                  let i = String(s);
                  if (!i) return null;
                  const isDesc = i.startsWith('-');
                  return [i.substring(isDesc ? 1 : 0), isDesc ? 'DESC' : 'ASC'];
              })
            : [['Id', 'ASC']];
    }
    private buildQuery(q: Query<T>): WhereOptions<T> {
        const filter = this.convertQuery(q.filter);
        const { search } = q;

        const result = {
            [Op.and]: [
                filter && Object.keys(filter).length > 0 ? { [Op.and]: [{ ...filter }] } : null,
                search && search.fields && search.content
                    ? { [Op.or]: (search?.fields || []).map((f) => ({ [f]: { [Op.like]: `%${search.content}%` } })) }
                    : null,
            ].filter((i) => !!i),
        };
        return result;
    }
    private convertQuery(query: TypeKey<Query<T>, 'filter'>): TypeKey<Query<T>, 'filter'> {
        if (!query && !Object.entries(query || {}).length) return {};
        return Object.fromEntries(
            Object.entries(query).map(([k, v]) => {
                if (_.isPlainObject(v)) v = this.convertQuery(v as any);
                if (k.startsWith('$')) k = Op[k.slice(1)];
                return [k, v];
            })
        ) as TypeKey<Query<T>, 'filter'>;
    }
    private defaultPropsListProps(props: ListProps<T>): ListProps<T> {
        return {
            page: props.page || 1,
            pageSize: props.pageSize || 20,
            sorts: props.sorts || [],
        };
    }
}
