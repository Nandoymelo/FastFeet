import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { User } from '../entities/user'
import { NotAllowedError } from './errors/not-allowed-error'

interface GetDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
}

type GetDeliverymanUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    user: User
  }
>
export class GetDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    deliverymanId,
  }: GetDeliverymanUseCaseRequest): Promise<GetDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new ResourceNotFoundError())
    }

    return right({ user: deliveryman })
  }
}
