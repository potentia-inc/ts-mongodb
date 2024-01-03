/// <reference types="node" />
export { setTimeout as sleep } from 'node:timers/promises';
export declare function isNil<T>(x: T): x is Extract<T, null | undefined>;
