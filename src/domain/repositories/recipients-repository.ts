import type { PaginationParams } from '@/core/repositories/pagination-params'
import { Recipient } from '../entities/recipient'

export abstract class RecipientRepository {
  abstract create(recipient: Recipient): Promise<void>
  abstract save(recipient: Recipient): Promise<void>
  abstract delete(recipient: Recipient): Promise<void>
  abstract findById(id: string): Promise<Recipient | null>
  abstract findManyRecipient(params: PaginationParams): Promise<Recipient[]>
}
