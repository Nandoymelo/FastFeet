import { UsersRepository } from '@/domain/fastFee/application/repositories/user-repository'
import { PrismaService } from '../prisma.service'
import { User } from '@/domain/fastFee/enterprise/entities/user'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import { PrismaUserMapper } from '../mappers/prisma-user-mapper'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}
  async findByCpf(cpf: Cpf): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf.value },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findManyDeliverymen({ page }: PaginationParams): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role: 'DELIVERYMAN' },
      orderBy: { name: 'asc' },
      take: 20,
      skip: (page - 1) * 20,
    })

    return users.map(PrismaUserMapper.toDomain)
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.update({
      where: {
        id: user.id.toString(),
      },

      data,
    })
  }

  async delete(user: User): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: user.id.toString(),
      },
    })
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({ data })
  }
}
