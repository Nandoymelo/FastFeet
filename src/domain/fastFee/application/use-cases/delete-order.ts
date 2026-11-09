import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderCannotBeDeletedError } from './errors/order-cannot-delete-error'

interface DeleteOrderUseCaseRequest {
  adminId: string
  orderId: string
}

type DeleteOrderUseCaseResponse = Either<
  NotAllowedError | OrderNotFoundError | OrderCannotBeDeletedError,
  null
>

export class DeleteOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private orderRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: DeleteOrderUseCaseRequest): Promise<DeleteOrderUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    if (!order.canBeDeleted()) {
      return left(new OrderCannotBeDeletedError())
    }

    await this.orderRepository.delete(order)

    return right(null)
  }
}
