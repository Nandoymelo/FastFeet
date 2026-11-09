import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { User } from '../../enterprise/entities/user'

interface FetchDeliverymenUseCaseRequest {
  adminId: string
  page: number
}

type FetchDeliverymenUseCaseResponse = Either<
  NotAllowedError,
  {
    users: User[]
  }
>

export class FetchDeliverymenUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    page,
  }: FetchDeliverymenUseCaseRequest): Promise<FetchDeliverymenUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const deliverymens = await this.usersRepository.findManyDeliverymen({
      page,
    })

    return right({ users: deliverymens })
  }
}
