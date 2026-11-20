import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Order,
  type OrderProps,
} from '@/domain/fastFee/enterprise/entities/order'
import { PrismaOrderMapper } from '@/infra/database/prisma/mappers/prisma-order-mapper'
import { PrismaRecipientMapper } from '@/infra/database/prisma/mappers/prisma-recipient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { MakeRecipient } from './make-recipient'

export function MakeOrder(override: Partial<OrderProps> = {}) {
  const order = Order.create({
    recipientId: new UniqueEntityID(),
    ...override,
  })

  return order
}

@Injectable()
export class OrderFactory {
  constructor(private prisma: PrismaService) {}

  // O pedido tem FK para o destinatário (e para o entregador, quando informado):
  // se nenhum recipientId vier, um destinatário é criado junto. O deliverymanId,
  // quando passado, precisa ser de um usuário que já exista no banco.
  async makePrismaOrder(data: Partial<OrderProps> = {}): Promise<Order> {
    let recipientId = data.recipientId

    if (!recipientId) {
      const recipient = MakeRecipient()

      await this.prisma.recipient.create({
        data: PrismaRecipientMapper.toPrisma(recipient),
      })

      recipientId = recipient.id
    }

    const order = MakeOrder({ ...data, recipientId })

    await this.prisma.order.create({
      data: PrismaOrderMapper.toPrisma(order),
    })

    return order
  }
}
