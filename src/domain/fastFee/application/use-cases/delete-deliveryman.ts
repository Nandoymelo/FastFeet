import { left, right, type Either } from '@/core/types/either'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { UsersRepository } from '../repositories/user-repository'
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'

interface DeleteDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
}

type DeleteDeliverymanUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  null
>
@Injectable()
export class DeleteDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    deliverymanId,
  }: DeleteDeliverymanUseCaseRequest): Promise<DeleteDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new ResourceNotFoundError())
    }

    await this.usersRepository.delete(deliveryman)

    return right(null)
  }
}
