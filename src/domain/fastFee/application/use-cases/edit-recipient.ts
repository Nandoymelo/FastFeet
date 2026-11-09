import { left, right, type Either } from '@/core/types/either'
import { RecipientRepository } from '../repositories/recipients-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Recipient } from '../../enterprise/entities/recipient'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

interface EditRecipientUseCaseRequest {
  adminId: string
  recipientId: string
  name: string
  address: string
  longitude: number
  latitude: number
}

type EditRecipientUseCaseResponse = Either<
  NotAllowedError | RecipientNotFoundError,
  {
    recipient: Recipient
  }
>

export class EditRecipientUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientRepository: RecipientRepository,
  ) {}

  async execute({
    name,
    address,
    adminId,
    recipientId,
    longitude,
    latitude,
  }: EditRecipientUseCaseRequest): Promise<EditRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const recipient = await this.recipientRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError(recipientId))
    }

    recipient.name = name
    recipient.address = address
    recipient.latitude = latitude
    recipient.longitude = longitude

    await this.recipientRepository.save(recipient)

    return right({ recipient })
  }
}
