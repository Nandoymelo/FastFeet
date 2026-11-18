import { Injectable } from '@nestjs/common'
import { faker } from '@faker-js/faker'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, type UserProps } from '@/domain/fastFee/enterprise/entities/user'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import { PrismaUserMapper } from '@/infra/database/prisma/mappers/prisma-user-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { generateCpf } from '../utils/generate-cpf'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      cpf: Cpf.create(generateCpf()),
      password: faker.internet.password(),
      role: 'ADMIN',
      ...override,
    },
    id,
  )

  return user
}

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaUser(data: Partial<UserProps> = {}): Promise<User> {
    const user = makeUser(data)

    await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    })

    return user
  }
}
