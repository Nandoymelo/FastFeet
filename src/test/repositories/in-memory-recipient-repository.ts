import type { PaginationParams } from '@/core/repositories/pagination-params'
import { Recipient } from '@/domain/entities/recipient'
import { RecipientRepository } from '@/domain/repositories/recipients-repository'

export class InMemoryRecipientRepository implements RecipientRepository {
  public items: Recipient[] = []

  async save(recipient: Recipient) {
    const recipientIndex = this.items.findIndex(
      (item) => item.id === recipient.id,
    )

    this.items[recipientIndex] = recipient
  }

  async findManyRecipient({ page }: PaginationParams) {
    const recipients = this.items
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice((page - 1) * 20, page * 20)

    return recipients
  }

  async findById(id: string) {
    const recipient = this.items.find((item) => item.id.toString() === id)

    if (!recipient) {
      return null
    }

    return recipient
  }

  async delete(recipient: Recipient) {
    const recipientIndex = this.items.findIndex(
      (item) => item.id === recipient.id,
    )

    this.items.splice(recipientIndex, 1)
  }

  async create(recipient: Recipient) {
    this.items.push(recipient)
  }
}
