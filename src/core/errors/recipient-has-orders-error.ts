export class RecipientHasOrdersError extends Error {
  constructor() {
    super('Recipient cannot be deleted because it has orders.')
  }
}
