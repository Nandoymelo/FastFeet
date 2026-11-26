import { left, right, type Either } from '@/core/types/either'
import { RecipientRepository } from '../repositories/recipients-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { RecipientNotFoundError } from '../../../../core/errors/recipient-not-found-error'
import { UsersRepository } from '../repositories/user-repository'
import { Injectable } from '@nestjs/common'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientHasOrdersError } from '../../../../core/errors/recipient-has-orders-error'

interface DeleteRecipientUseCaseRequest {
  adminId: string
  recipientId: string
}

type DeleteRecipientUseCaseResponse = Either<
  NotAllowedError | RecipientNotFoundError | RecipientHasOrdersError,
  null
>

@Injectable()
export class DeleteRecipientUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientRepository: RecipientRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: DeleteRecipientUseCaseRequest): Promise<DeleteRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = await this.recipientRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError(recipientId))
    }

    if (await this.ordersRepository.hasOrdersByRecipientId(recipientId)) {
      return left(new RecipientHasOrdersError())
    }

    await this.recipientRepository.delete(recipient)

    return right(null)
  }
}
