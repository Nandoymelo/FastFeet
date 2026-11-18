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

  findManyDeliverymen(params: PaginationParams): Promise<User[]> {
    throw new Error('Method not implemented.')
  }

  save(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }

  delete(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({ data })
  }
}
