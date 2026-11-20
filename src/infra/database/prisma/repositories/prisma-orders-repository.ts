import { DomainEvents } from '@/core/events/domain-events'
import type { FindManyAvailableNearbyParams } from '@/core/repositories/find-many-nearby-params'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import { OrdersRepository } from '@/domain/fastFee/application/repositories/orders-repository'
import { Order } from '@/domain/fastFee/enterprise/entities/order'
import { Injectable } from '@nestjs/common'
import { PrismaOrderMapper } from '../mappers/prisma-order-mapper'
import { PrismaService } from '../prisma.service'

const PAGE_SIZE = 20

// Mesma constante usada em getDistanceBetweenCoordinates (graus -> milhas -> km)
const KM_PER_DEGREE = 60 * 1.1515 * 1.609344

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async create(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.create({ data })
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return null
    }

    return PrismaOrderMapper.toDomain(order)
  }

  async save(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.update({
      where: { id: order.id.toString() },
      data,
    })

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async delete(order: Order): Promise<void> {
    await this.prisma.order.delete({
      where: { id: order.id.toString() },
    })
  }

  async findManyOrder({ page }: PaginationParams): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    })

    return orders.map(PrismaOrderMapper.toDomain)
  }

  async findManyByDeliverymanId(
    deliverymanId: string,
    { page }: PaginationParams,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { deliverymanId },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    })

    return orders.map(PrismaOrderMapper.toDomain)
  }

  async findManyAvailableNearby(
    { latitude, longitude, maxDistanceInKm }: FindManyAvailableNearbyParams,
    { page }: PaginationParams,
  ): Promise<Order[]> {
    // O pedido não tem coordenadas: a distância é calculada a partir do
    // destinatário. Mesma fórmula (lei dos cossenos) do getDistanceBetweenCoordinates,
    // e mesma regra de Order.canBePickedUp().
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM (
        SELECT
          o.id,
          o.created_at,
          degrees(acos(least(1.0, greatest(-1.0,
            sin(radians(${latitude})) * sin(radians(r.latitude)) +
            cos(radians(${latitude})) * cos(radians(r.latitude)) *
            cos(radians(${longitude} - r.longitude))
          )))) * ${KM_PER_DEGREE} AS distance
        FROM orders o
        INNER JOIN recipients r ON r.id = o.recipient_id
        WHERE o.available_at IS NOT NULL
          AND o.picked_up_at IS NULL
          AND o.delivered_at IS NULL
          AND o.returned_at IS NULL
      ) AS nearby
      WHERE distance <= ${maxDistanceInKm}
      ORDER BY distance ASC, created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
    `

    const ids = rows.map((row) => row.id)

    if (ids.length === 0) {
      return []
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: ids } },
    })

    // O findMany com "in" não preserva a ordem por distância
    return ids.flatMap((id) => {
      const order = orders.find((item) => item.id === id)

      return order ? [PrismaOrderMapper.toDomain(order)] : []
    })
  }
}
