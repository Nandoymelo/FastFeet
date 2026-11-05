export class RecipientNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Recipient "${identifier}" not found.`)
  }
}
