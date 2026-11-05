import { left, right, type Either } from '@/core/types/either'
import { RecipientRepository } from '../repositories/recipients-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { Recipient } from '../entities/recipient'

interface GetRecipientUseCaseRequest {
  adminId: string
  recipientId: string
}

type GetRecipientUseCaseResponse = Either<
  NotAllowedError | RecipientNotFoundError,
  {
    recipient: Recipient
  }
>
export class GetRecipientUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientsRepository: RecipientRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: GetRecipientUseCaseRequest): Promise<GetRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError(recipientId))
    }

    return right({ recipient })
  }
}
