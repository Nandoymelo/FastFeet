import { User } from '../entities/user'
import { Cpf } from '../entities/value-object/cpf'
import { HashGenerator } from '@/core/cryptography/hash-generator'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { left, right, type Either } from '@/core/types/either'

interface RegisterDeliverymanUseCaseRequest {
  adminId: string
  name: string
  cpf: string
  password: string
}

type RegisterDeliverymanUseCaseResponse = Either<
  UserAlreadyExistsError | NotAllowedError,
  { user: User }
>

export class RegisterDeliverymanUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    adminId,
    name,
    cpf,
    password,
  }: RegisterDeliverymanUseCaseRequest): Promise<RegisterDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const userCpf = Cpf.create(cpf)

    const userWithSameCpf = await this.usersRepository.findByCpf(userCpf)

    if (userWithSameCpf) {
      return left(new UserAlreadyExistsError(cpf))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const user = User.create({
      name,
      cpf: userCpf,
      password: hashedPassword,
      role: 'DELIVERYMAN',
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
