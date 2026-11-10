export class DeliveryPhotoRequiredError extends Error {
  constructor() {
    super('Delivery photo is required.')
  }
}
