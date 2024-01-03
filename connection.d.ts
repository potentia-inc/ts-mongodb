import { CommandOperationOptions, Db, Document, MongoClient, MongoClientOptions } from 'mongodb';
export declare class Connection {
    #private;
    get client(): MongoClient;
    get db(): Db;
    constructor(uri: string, options?: MongoClientOptions);
    connect(): Promise<MongoClient>;
    disconnect(force?: boolean): Promise<void>;
    transaction<T>(fn: (options: CommandOperationOptions) => Promise<T>, options?: CommandOperationOptions): Promise<T>;
    migrate<Doc extends Document>({ name, validator, indexes, }: {
        name: string;
        validator: Document;
        indexes: Document;
    }): Promise<void>;
}
export declare function isTransactionError(err: unknown): boolean;
export declare function isDuplicationError(err: unknown): boolean;
