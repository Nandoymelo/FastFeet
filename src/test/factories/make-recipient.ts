import {
  Recipient,
  type RecipientProps,
} from '@/domain/fastFee/enterprise/entities/recipient'
import { PrismaRecipientMapper } from '@/infra/database/prisma/mappers/prisma-recipient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function MakeRecipient(override: Partial<RecipientProps> = {}) {
  const recipient = Recipient.create({
    name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    longitude: faker.location.longitude(),
    latitude: faker.location.latitude(),
    ...override,
  })

  return recipient
}
@Injectable()
export class RecipientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipient(
    data: Partial<RecipientProps> = {},
  ): Promise<Recipient> {
    const recipient = MakeRecipient(data)

    await this.prisma.recipient.create({
      data: PrismaRecipientMapper.toPrisma(recipient),
    })

    return recipient
  }
}
