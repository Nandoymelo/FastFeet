import type { PaginationParams } from '@/core/repositories/pagination-params'
import { Order } from '../entities/order'

export abstract class OrdersRepository {
  abstract create(order: Order): Promise<void>
  abstract findById(id: string): Promise<Order | null>
  abstract save(order: Order): Promise<void>
  abstract delete(order: Order): Promise<void>
  abstract findManyOrder(page: PaginationParams): Promise<Order[]>
}
