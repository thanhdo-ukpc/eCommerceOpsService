export type TypeKey<P, K extends keyof P> = P[K];

export type TypeOfArray<T> = T extends (infer R)[] ? R : T;

export const $NestedValue: unique symbol = Symbol();
type NestedValue<TValue extends object = object> = {
    [$NestedValue]: never;
} & TValue;

export type DeepPartial<T> = T extends Date | FileList | File | NestedValue | string
    ? T
    : {
        [K in keyof T]?: DeepPartial<T[K]>;
    };

type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T
    ? ((t: T, ...a: A) => void) extends (...x: infer X) => void
    ? X
    : never
    : never;

type EnumerateInternal<A extends Array<unknown>, N extends number> = {
    0: A;
    1: EnumerateInternal<PrependNextNum<A>, N>;
}[N extends A['length'] ? 0 : 1];

type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never;

export type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;
