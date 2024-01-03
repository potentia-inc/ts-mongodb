export declare class DBError extends Error {
    constructor(message?: string);
}
export declare class DisconnectedError extends DBError {
    constructor(message?: string);
}
export declare class NotFoundError extends DBError {
    constructor(message?: string);
}
export declare class ConflictError extends DBError {
    constructor(message?: string);
}
export declare class TransactionError extends DBError {
    constructor(message?: string);
}
export declare class UnacknowledgedError extends DBError {
    constructor(message?: string);
}
