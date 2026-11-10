import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { Order } from '../../enterprise/entities/order'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '../../../../core/errors/order-status-transition-error'

interface PickUpOrderUseCaseRequest {
  deliverymanId: string
  orderId: string
}

type PickUpOrderUseCaseResponse = Either<
  NotAllowedError | OrderNotFoundError | OrderStatusTransitionError,
  {
    order: Order
  }
>

export class PickUpOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    deliverymanId,
    orderId,
  }: PickUpOrderUseCaseRequest): Promise<PickUpOrderUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new NotAllowedError(deliveryman?.id.toString() ?? 'unknown'))
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    if (!order.canBePickedUp()) {
      return left(new OrderStatusTransitionError())
    }

    order.pickUp(deliveryman.id)

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
