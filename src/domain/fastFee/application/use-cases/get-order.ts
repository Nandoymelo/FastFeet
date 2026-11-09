import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'

interface GetOrdertUseCaseRequest {
  adminId: string
  orderId: string
}

type GetOrdertUseCaseResponse = Either<
  NotAllowedError | OrderNotFoundError,
  {
    order: Order
  }
>
export class GetOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private orderRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: GetOrdertUseCaseRequest): Promise<GetOrdertUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    return right({ order })
  }
}
