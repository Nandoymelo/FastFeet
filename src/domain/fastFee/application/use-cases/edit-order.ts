import { left, right, type Either } from '@/core/types/either'
import type { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientRepository } from '../repositories/recipients-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { RecipientNotFoundError } from '../../../../core/errors/recipient-not-found-error'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'
import { OrderCannotBeEditedError } from '../../../../core/errors/order-cannot-be-edited-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'

interface EditOrderUseCaseCaseRequest {
  adminId: string
  recipientId: string
  orderId: string
}

type EditOrderUseCaseCaseResponse = Either<
  | NotAllowedError
  | RecipientNotFoundError
  | OrderNotFoundError
  | OrderCannotBeEditedError,
  {
    order: Order
  }
>

@Injectable()
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
    } catch {
      return left(new OrderCannotBeEditedError())
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
