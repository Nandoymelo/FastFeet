export class OrderCannotBeDeletedError extends Error {
  constructor() {
    super('Order cannot be deleted after pickup.')
  }
}
