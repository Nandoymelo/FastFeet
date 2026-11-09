import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Order } from '../../enterprise/entities/order'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderStatusTransitionError } from './errors/order-status-transition-error'

interface MakeOrderAvailableUseCaseRequest {
  adminId: string
  orderId: string
}

type MakeOrderAvailableUseCaseResponse = Either<
  NotAllowedError | OrderNotFoundError | OrderStatusTransitionError,
  {
    order: Order
  }
>

export class MakeOrderAvailableUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: MakeOrderAvailableUseCaseRequest): Promise<MakeOrderAvailableUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    if (!order.canBeMadeAvailable()) {
      return left(new OrderStatusTransitionError())
    }

    order.makeAvailable()

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
