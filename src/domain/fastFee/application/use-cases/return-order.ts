import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { Order } from '../../enterprise/entities/order'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '../../../../core/errors/order-status-transition-error'

interface ReturnOrderUseCaseRequest {
  deliverymanId: string
  orderId: string
}

type ReturnOrderUseCaseResponse = Either<
  NotAllowedError | OrderNotFoundError | OrderStatusTransitionError,
  {
    order: Order
  }
>

export class ReturnOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    deliverymanId,
    orderId,
  }: ReturnOrderUseCaseRequest): Promise<ReturnOrderUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new NotAllowedError(deliveryman?.id.toString() ?? 'unknown'))
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    if (!order.canBeReturnedBy(deliveryman.id)) {
      return left(new OrderStatusTransitionError())
    }

    order.returned(deliveryman.id)

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
