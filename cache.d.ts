export interface Options {
    ttl: number;
    capacity: number;
    interval?: number;
}
export declare class Cache<T> {
    ttl: number;
    capacity: number;
    interval: number;
    last?: Date;
    map: Map<string, [number, T]>;
    list: Array<[number, string]>;
    constructor({ ttl, capacity, interval }: Options);
    set(key: string, value: T, time?: Date): Cache<T>;
    get(key: string, time?: Date): T | undefined;
    isFull(): boolean;
    scrub(time?: Date): void;
    evict(): void;
}
