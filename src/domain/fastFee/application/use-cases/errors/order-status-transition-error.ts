export class OrderStatusTransitionError extends Error {
  constructor() {
    super('status order cannot be changed.')
  }
}
