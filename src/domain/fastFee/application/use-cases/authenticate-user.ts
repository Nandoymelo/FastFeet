import type { HashCompare } from '@/core/cryptography/hash-compare'
import { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/user-repository'
import { Cpf } from '../../enterprise/entities/value-object/cpf'
import { WrongCredentialsError } from '../../../../core/errors/wrong-credentials-error'
import { left, right, type Either } from '@/core/types/either'

interface AuthenticateUseCaseRequest {
  cpf: string
  password: string
}

type AuthenticateUseCaseResponse = Either<
  WrongCredentialsError,
  {
    user: User
  }
>

export class AuthenticateUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashCompare: HashCompare,
  ) {}

  async execute({
    cpf,
    password,
  }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
    if (!Cpf.isValid(cpf)) {
      return left(new WrongCredentialsError())
    }
    const userCpf = Cpf.create(cpf)

    const user = await this.usersRepository.findByCpf(userCpf)

    if (!user) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashCompare.compare(
      password,
      user.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    return right({ user })
  }
}
