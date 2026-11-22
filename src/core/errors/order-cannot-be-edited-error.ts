export class OrderCannotBeEditedError extends Error {
  constructor() {
    super('Order cannot be edited after pickup.')
  }
}
