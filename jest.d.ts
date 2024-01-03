/// <reference types="jest" />
interface CustomMatchers<R = unknown> {
    toBeBinary: (this: unknown) => R;
    toEqualBinary: (this: unknown, expected: unknown) => R;
    toBeBuffer: (this: unknown) => R;
    toEqualBuffer: (this: unknown, expected: unknown) => R;
    toBeDecimal128: (this: unknown) => R;
    toBeDecimal128NaN: (this: unknown) => R;
    toEqualDecimal128: (this: unknown, expected: unknown) => R;
    toBeObjectId: (this: unknown) => R;
    toEqualObjectId: (this: unknown, expected: unknown) => R;
    toBeUUID: (this: unknown) => R;
    toEqualUUID: (this: unknown, expected: unknown) => R;
}
declare global {
    namespace jest {
        interface Expect extends CustomMatchers {
        }
        interface Matchers<R> extends CustomMatchers<R> {
        }
        interface InverseAsymmetricMatchers extends CustomMatchers {
        }
    }
}
export declare function toBeBinary(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toEqualBinary(this: unknown, received: unknown, expected: unknown): jest.CustomMatcherResult;
export declare function toBeDecimal128(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toEqualDecimal128(this: unknown, received: unknown, expected: unknown): jest.CustomMatcherResult;
export declare function toBeDecimal128NaN(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toBeBuffer(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toEqualBuffer(this: unknown, received: unknown, expected: unknown): jest.CustomMatcherResult;
export declare function toBeObjectId(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toEqualObjectId(this: unknown, received: unknown, expected: unknown): jest.CustomMatcherResult;
export declare function toBeUUID(this: unknown, received: unknown): jest.CustomMatcherResult;
export declare function toEqualUUID(this: unknown, received: unknown, expected: unknown): jest.CustomMatcherResult;
export {};
