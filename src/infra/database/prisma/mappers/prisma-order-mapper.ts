import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Order } from '@/domain/fastFee/enterprise/entities/order'
import type { Order as PrismaOrder, Prisma } from '@prisma/client'

export class PrismaOrderMapper {
  static toDomain(raw: PrismaOrder): Order {
    // Com exactOptionalPropertyTypes, um campo opcional não pode receber
    // undefined explícito: ele só entra no objeto quando existe no banco.
    return Order.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        createdAt: raw.createdAt,
        ...(raw.deliverymanId && {
          deliverymanId: new UniqueEntityID(raw.deliverymanId),
        }),
        ...(raw.deliveryPhotoUrl && {
          deliveryPhotoUrl: raw.deliveryPhotoUrl,
        }),
        ...(raw.availableAt && { availableAt: raw.availableAt }),
        ...(raw.pickedUpAt && { pickedUpAt: raw.pickedUpAt }),
        ...(raw.deliveredAt && { deliveredAt: raw.deliveredAt }),
        ...(raw.returnedAt && { returnedAt: raw.returnedAt }),
      },
      new UniqueEntityID(raw.id),
    )
  }

  // Os campos opcionais vão como null (e não undefined) para que o update
  // do Prisma realmente limpe o valor, em vez de ignorar o campo.
  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id.toString(),
      recipientId: order.recipientId.toString(),
      deliverymanId: order.deliverymanId?.toString() ?? null,
      deliveryPhotoUrl: order.deliveryPhotoUrl ?? null,
      createdAt: order.createdAt,
      availableAt: order.availableAt ?? null,
      pickedUpAt: order.pickedUpAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
      returnedAt: order.returnedAt ?? null,
    }
  }
}
