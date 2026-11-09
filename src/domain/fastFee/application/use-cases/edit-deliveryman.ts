import { left, right, type Either } from '@/core/types/either'
import { NotAllowedError } from './errors/not-allowed-error'
import { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/user-repository'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { Cpf } from '../../enterprise/entities/value-object/cpf'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface EditDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
  cpf: string
  name: string
}

type EditDeliverymanUseCaseResponse = Either<
  NotAllowedError | UserAlreadyExistsError,
  {
    user: User
  }
>

export class EditDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    cpf,
    name,
    adminId,
    deliverymanId,
  }: EditDeliverymanUseCaseRequest): Promise<EditDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unkown'))
    }

    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new ResourceNotFoundError())
    }

    const newCpf = Cpf.create(cpf)

    const userWithSameCpf = await this.usersRepository.findByCpf(newCpf)

    if (
      userWithSameCpf &&
      userWithSameCpf.id.toString() !== deliveryman.id.toString()
    ) {
      return left(new UserAlreadyExistsError(cpf))
    }

    deliveryman.name = name
    deliveryman.cpf = newCpf

    await this.usersRepository.save(deliveryman)

    return right({
      user: deliveryman,
    })
  }
}
