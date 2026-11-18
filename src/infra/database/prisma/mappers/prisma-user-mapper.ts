import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { UserRole } from '@/core/entities/user-role'
import { User } from '@/domain/fastFee/enterprise/entities/user'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import type { User as PrismaUser } from '@prisma/client'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        password: raw.passwordHash,
        cpf: Cpf.create(raw.cpf),
        role: raw.role as UserRole,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(user: User) {
    return {
      id: user.id.toString(),
      name: user.name,
      cpf: user.cpf.value,
      passwordHash: user.password,
      role: user.role,
    }
  }
}
