export class OrderNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Order "${identifier}" not found.`)
  }
}
