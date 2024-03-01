export interface GetProps<T> {
    id?: string;
    populate?: string[];
    fields?: (keyof T)[];
    mapping?: boolean;
}

export interface CountProps<T> extends Query<T> {}

export interface BaseListProps<T> extends Query<T> {
    populate?: string[];
    fields?: (keyof T)[];
    sorts?: (keyof T | keyof AsTypeSort<T> | Function)[];
}
type Normal<S extends string> = S;

type AsTypeSort<T> = {
    [P in keyof T as `-${Normal<string & P>}`]: T[P];
};

const Op = {
    $eq: Symbol.for('eq'),
    $ne: Symbol.for('ne'),
    $gte: Symbol.for('gte'),
    $gt: Symbol.for('gt'),
    $lte: Symbol.for('lte'),
    $lt: Symbol.for('lt'),
    $not: Symbol.for('not'),
    $notIn: Symbol.for('notIn'),
    $notLike: Symbol.for('notLike'),
    $notILike: Symbol.for('notILike'),
    $like: Symbol.for('like'),
    $regexp: Symbol.for('regexp'),
};
type TypeOP = typeof Op;
type TypeOPString = Pick<TypeOP, '$notILike' | '$notLike' | '$regexp' | '$notIn' | '$like'>;
type TypeOPDateAndNumber = Omit<TypeOP, keyof Omit<TypeOPString, '$notIn'>>;
type GetTypeOp<T> = T extends string ? TypeOPString : T extends number ? TypeOPDateAndNumber : TypeOPDateAndNumber;
type RemoveArray<T> = T extends (infer R)[] ? R : T;
export type Filter<T> = {
    [P in keyof T]?: T[P] | RemoveArray<T[P]>[] | Partial<Record<keyof GetTypeOp<T[P]>, T[P] | T[P][]>>;
};

export interface Query<T> {
    search?: Search<T>;
    filter?: Filter<T> & { $or?: Filter<T> };
}

export interface Search<T> {
    content: string;
    fields?: (keyof T)[];
}
export interface ListProps<T> extends BaseListProps<T> {
    page?: number;
    pageSize?: number;
}
export interface FindProps<T> extends BaseListProps<T> {
    limit?: number;
    offset?: number;
}
