import {
  CommandOperationOptions,
  Db,
  Document,
  MongoClient,
  MongoClientOptions,
  MongoError,
} from 'mongodb'
import { ConflictError, DisconnectedError, TransactionError } from './error.js'
import { sleep } from './util.js'

export class Connection {
  #client?: MongoClient = undefined
  #locking: boolean = false
  #uri: string
  #options?: MongoClientOptions

  get client(): MongoClient {
    if (this.#client === undefined) throw new DisconnectedError()
    return this.#client
  }

  get db(): Db {
    return this.client.db()
  }

  constructor(uri: string, options?: MongoClientOptions) {
    this.#uri = uri
    this.#options = options
  }

  async connect(): Promise<MongoClient> {
    while (this.#client === undefined && this.#locking) await sleep(50)
    if (this.#client !== undefined) return this.#client
    this.#locking = true
    try {
      this.#client = await MongoClient.connect(this.#uri, this.#options)
      ;['error', 'timeout', 'parseError'].forEach((event) => {
        this.#client?.on(event, (...args) =>
          console.error(`db event ${event}: ${JSON.stringify(args)}`),
        )
      })
      return this.#client
    } finally {
      this.#locking = false
    }
  }

  async disconnect(force = false): Promise<void> {
    while (this.#client !== undefined && this.#locking) await sleep(50)
    if (this.#client === undefined) return
    this.#locking = true
    try {
      await this.#client.close(force)
      this.#client = undefined
    } finally {
      this.#locking = false
    }
  }

  async transaction<T>(
    fn: (options: CommandOperationOptions) => Promise<T>,
    options: CommandOperationOptions = {},
  ): Promise<T> {
    if (options?.session !== undefined) return await fn(options)
    const session = this.client.startSession()
    try {
      return await session.withTransaction(
        async (session) => await fn({ ...options, session }),
      )
    } catch (err) {
      if (isDuplicationError(err)) throw new ConflictError()
      if (isTransactionError(err)) throw new TransactionError()
      throw err
    } finally {
      await session.endSession()
    }
  }

  async migrate<Doc extends Document>({
    name,
    validator,
    indexes = {},
  }: {
    name: string
    validator?: Document
    indexes?: Document
  }): Promise<void> {
    const collection = await (async () => {
      try {
        return await this.db.createCollection<Doc>(name)
      } catch (err) {
        return this.db.collection<Doc>(name)
      }
    })()

    // create/update the current index
    for (const name of Object.keys(indexes)) {
      const { keys, options = {} } = indexes[name]
      try {
        // try to create the index
        await collection.createIndex(keys, { name, ...options })
      } catch (err) {
        // if fails, drop it and try it again
        console.warn('fail to create index:', err)
        try {
          await collection.dropIndex(name)
        } catch (err) {
          console.warn('fail to drop index:', err)
        }
        await collection.createIndex(keys, { name, ...options })
      }
    }

    // drop the removed indexes
    const names = (await collection.listIndexes().toArray())
      .map(({ name }) => name)
      .filter((name) => !(name === '_id_' || name in indexes))
    for (const name of names) await collection.dropIndex(name)

    // update the validator
    if (validator !== undefined) {
      await this.db.command({
        collMod: name,
        validator,
        validationLevel: 'strict',
        validationAction: 'error',
      })
    }
  }
}

export function isTransactionError(err: unknown): boolean {
  return (
    err instanceof MongoError &&
    err.errorLabels !== undefined &&
    Array.isArray(err.errorLabels) &&
    err.errorLabels.includes('TransientTransactionError')
  )
}

export function isDuplicationError(err: unknown): boolean {
  return (
    err instanceof MongoError &&
    err.message.startsWith('E11000 duplicate key error')
  )
}
