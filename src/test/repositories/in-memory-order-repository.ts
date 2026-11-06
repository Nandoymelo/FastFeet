import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Order } from '@/domain/entities/order'
import { OrdersRepository } from '@/domain/repositories/orders-repository'

export class InMemoryOrderRepository implements OrdersRepository {
  async findManyOrder({ page }: PaginationParams) {
    const orders = this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * 20, page * 20)

    return orders
  }

  async delete(order: Order): Promise<void> {
    const orderIndex = this.items.findIndex((item) => item.id === order.id)

    this.items.splice(orderIndex, 1)
  }

  async save(order: Order) {
    const orderIndex = this.items.findIndex((item) => item.id === order.id)

    this.items[orderIndex] = order
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
