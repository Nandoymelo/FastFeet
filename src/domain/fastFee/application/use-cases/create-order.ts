import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientRepository } from '../repositories/recipients-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { Order } from '../../enterprise/entities/order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface CreateOrderUseCaseRequest {
  adminId: string
  recipientId: string
}

type CreateOrderUseCaseResponse = Either<
  NotAllowedError | RecipientNotFoundError,
  {
    order: Order
  }
>

export class CreateOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientRepository: RecipientRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: CreateOrderUseCaseRequest): Promise<CreateOrderUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = await this.recipientRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError(recipientId))
    }

    const order = Order.create({
      recipientId: new UniqueEntityID(recipientId),
    })

    await this.ordersRepository.create(order)

    return right({ order })
  }
}
