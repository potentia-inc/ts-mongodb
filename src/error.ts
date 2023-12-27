export class DBError extends Error {
  constructor(message?: string) {
    super(message ?? 'Unknown DB Error')
  }
}

export class DisconnectedError extends DBError {
  constructor(message?: string) {
    super(message ?? 'Disconnected')
  }
}

export class NotFoundError extends DBError {
  constructor(message?: string) {
    super(message ?? 'Not Found')
  }
}

export class ConflictError extends DBError {
  constructor(message?: string) {
    super(message ?? 'Conflict')
  }
}

export class TransactionError extends DBError {
  constructor(message?: string) {
    super(message ?? 'Transaction Error')
  }
}

export class UnacknowledgedError extends DBError {
  constructor(message?: string) {
    super(message ?? 'Unacknowledged')
  }
}
