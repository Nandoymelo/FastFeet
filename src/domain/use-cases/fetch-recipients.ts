import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Recipient } from '../entities/recipient'
import { RecipientRepository } from '../repositories/recipients-repository'

interface FetchRecipientUseCaseRequest {
  adminId: string
  page: number
}

type FetchRecipientUseCaseResponse = Either<
  NotAllowedError,
  {
    recipients: Recipient[]
  }
>

export class FetchRecipientUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientsRepository: RecipientRepository,
  ) {}

  async execute({
    adminId,
    page,
  }: FetchRecipientUseCaseRequest): Promise<FetchRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipients = await this.recipientsRepository.findManyRecipient({
      page,
    })

    return right({ recipients })
  }
}
