import { Recipient } from '@/domain/entities/recipient'
import { RecipientRepository } from '@/domain/repositories/recipients-repository'

export class InMemoryRecipientRepository implements RecipientRepository {
  async save(recipient: Recipient) {
    const recipientIndex = this.items.findIndex(
      (item) => item.id === recipient.id,
    )

    this.items[recipientIndex] = recipient
  }

  async findById(id: string) {
    const recipient = this.items.find((item) => item.id.toString() === id)

    if (!recipient) {
      return null
    }

    return recipient
  }

  public items: Recipient[] = []

  async create(recipient: Recipient) {
    this.items.push(recipient)
  }
}
