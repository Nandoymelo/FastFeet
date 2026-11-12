import { DomainEvents } from '@/core/events/domain-events'
import type { FindManyAvailableNearbyParams } from '@/core/repositories/find-many-nearby-params'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import { OrdersRepository } from '@/domain/fastFee/application/repositories/orders-repository'
import { Order } from '@/domain/fastFee/enterprise/entities/order'
import { InMemoryRecipientRepository } from './in-memory-recipient-repository'
import { getDistanceBetweenCoordinates } from '@/core/utils/get-distance-between-coordinates'

export class InMemoryOrderRepository implements OrdersRepository {
  constructor(private recipientsRepository: InMemoryRecipientRepository) {}

  async findManyOrder({ page }: PaginationParams) {
    const orders = this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    return orders
  }

  async findManyAvailableNearby(
    { latitude, longitude, maxDistanceInKm }: FindManyAvailableNearbyParams,
    { page }: PaginationParams,
  ) {
    return this.items
      .filter((order) => order.canBePickedUp())
      .flatMap((order) => {
        const recipient = this.recipientsRepository.items.find(
          (recipient) =>
            recipient.id.toString() === order.recipientId.toString(),
        )

        if (!recipient) {
          return []
        }

        const distance = getDistanceBetweenCoordinates(
          { latitude, longitude },
          { latitude: recipient.latitude, longitude: recipient.longitude },
        )

        return distance <= maxDistanceInKm ? [{ order, distance }] : []
      })
      .sort((a, b) => a.distance - b.distance)
      .slice((page - 1) * 20, page * 20)
      .map((item) => item.order)
  }

  async delete(order: Order): Promise<void> {
    const orderIndex = this.items.findIndex((item) => item.id === order.id)

    this.items.splice(orderIndex, 1)
  }

  async save(order: Order) {
    const orderIndex = this.items.findIndex((item) => item.id === order.id)

    this.items[orderIndex] = order
    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async create(order: Order) {
    this.items.push(order)
  }

  async findById(id: string) {
    const order = this.items.find((item) => item.id.toString() === id)

    if (!order) {
      return null
    }

    return order
  }

  public items: Order[] = []
}
