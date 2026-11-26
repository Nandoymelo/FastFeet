import type { PaginationParams } from '@/core/repositories/pagination-params'
import { RecipientRepository } from '@/domain/fastFee/application/repositories/recipients-repository'
import { Recipient } from '@/domain/fastFee/enterprise/entities/recipient'
import { PrismaRecipientMapper } from '../mappers/prisma-recipient-mapper'
import { PrismaService } from '../prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaRecipientsRepository implements RecipientRepository {
  constructor(private prisma: PrismaService) {}
  async create(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.create({ data })
  }

  async save(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.update({
      where: {
        id: recipient.id.toString(),
      },

      data,
    })
  }

  async delete(recipient: Recipient): Promise<void> {
    await this.prisma.recipient.delete({
      where: {
        id: recipient.id.toString(),
      },
    })
  }

  async findById(id: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: { id },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findManyByIds(ids: string[]): Promise<Recipient[]> {
    const recipients = await this.prisma.recipient.findMany({
      where: { id: { in: ids } },
    })

    return recipients.map(PrismaRecipientMapper.toDomain)
  }

  async findManyRecipient({ page }: PaginationParams): Promise<Recipient[]> {
    const recipients = await this.prisma.recipient.findMany({
      orderBy: { name: 'asc' },
      take: 20,
      skip: (page - 1) * 20,
    })

    return recipients.map(PrismaRecipientMapper.toDomain)
  }
}
