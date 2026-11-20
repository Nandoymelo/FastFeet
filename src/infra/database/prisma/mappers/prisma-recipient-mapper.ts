import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipient } from '@/domain/fastFee/enterprise/entities/recipient'
import type { Recipient as PrismaRecipient } from '@prisma/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient): Recipient {
    return Recipient.create(
      {
        name: raw.name,
        address: raw.address,
        latitude: raw.latitude,
        longitude: raw.longitude,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(recipient: Recipient) {
    return {
      id: recipient.id.toString(),
      name: recipient.name,
      address: recipient.address,
      longitude: recipient.longitude,
      latitude: recipient.latitude,
    }
  }
}
