import { left, right, type Either } from '@/core/types/either'
import type { RecipientRepository } from '../repositories/recipients-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Recipient } from '../../enterprise/entities/recipient'
import { UsersRepository } from '../repositories/user-repository'

interface CreateRecipientUseCaseRequest {
  adminId: string
  name: string
  address: string
  longitude: number
  latitude: number
}

type CreateRecipientUseCaseResponse = Either<
  NotAllowedError,
  {
    recipient: Recipient
  }
>

export class CreateRecipientUseCase {
  constructor(
    private recipientsRepository: RecipientRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    name,
    address,
    latitude,
    longitude,
  }: CreateRecipientUseCaseRequest): Promise<CreateRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = Recipient.create({
      name,
      address,
      latitude,
      longitude,
    })

    await this.recipientsRepository.create(recipient)

    return right({ recipient })
  }
}
