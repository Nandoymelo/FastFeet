import { left, right, type Either } from '@/core/types/either'
import type { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientRepository } from '../repositories/recipients-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface EditOrderUseCaseCaseRequest {
  adminId: string
  recipientId: string
  orderId: string
}

type EditOrderUseCaseCaseResponse = Either<
  NotAllowedError | RecipientNotFoundError | OrderNotFoundError,
  {
    order: Order
  }
>

export class EditOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientRepository: RecipientRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
    orderId,
  }: EditOrderUseCaseCaseRequest): Promise<EditOrderUseCaseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = await this.recipientRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError(recipientId))
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }
    try {
      order.changeRecipient(new UniqueEntityID(recipientId))

      await this.ordersRepository.save(order)

      return right({ order })
    } catch {
      return left(new Error('Order cannot be edited after pickup.'))
    }
  }
}
