import { left, right, type Either } from '@/core/types/either'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/user-repository'
import { UserNotFoundError } from '../../../../core/errors/user-not-found-error'
import type { HashGenerator } from '@/core/cryptography/hash-generator'

interface ChangeUserPasswordUseCaseRequest {
  adminId: string
  userId: string
  password: string
}

type ChangeUserPasswordUseCaseResponse = Either<
  NotAllowedError | UserNotFoundError,
  {
    user: User
  }
>

export class ChangeUserPasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    adminId,
    userId,
    password,
  }: ChangeUserPasswordUseCaseRequest): Promise<ChangeUserPasswordUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError(userId))
    }

    const newHashedPassword = await this.hashGenerator.hash(password)

    user.password = newHashedPassword

    await this.usersRepository.save(user)

    return right({
      user,
    })
  }
}
