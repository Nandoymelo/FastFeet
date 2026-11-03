export class NotAllowedError extends Error {
  constructor(identifier: string) {
    super(`User "${identifier}" is not authorized.`)
  }
}
