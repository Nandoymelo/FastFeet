import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Order,
  type OrderProps,
} from '@/domain/fastFee/enterprise/entities/order'

export function MakeOrder(override: Partial<OrderProps> = {}) {
  const order = Order.create({
    recipientId: new UniqueEntityID(),
    ...override,
  })

  return order
}
