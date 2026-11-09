import type { PaginationParams } from '@/core/repositories/pagination-params'
import { UsersRepository } from '@/domain/fastFee/application/repositories/user-repository'
import { User } from '@/domain/fastFee/enterprise/entities/user'
import type { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findByCpf(cpf: Cpf) {
    const user = this.items.find((item) => item.cpf.equals(cpf))

    if (!user) {
      return null
    }

    return user
  }

  async findManyDeliverymen({ page }: PaginationParams) {
    const deliverymens = this.items
      .filter((item) => item.role === 'DELIVERYMAN')
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice((page - 1) * 20, page * 20)

    return deliverymens
  }

  async findById(id: string) {
    const user = this.items.find((item) => item.id.toString() === id)

    if (!user) {
      return null
    }

    return user
  }

  async save(user: User) {
    const userIndex = this.items.findIndex((item) => item.id === user.id)

    this.items[userIndex] = user
  }

  async delete(user: User) {
    const userIndex = this.items.findIndex((item) => item.id === user.id)

    this.items.splice(userIndex, 1)
  }

  async create(user: User) {
    this.items.push(user)
  }
}
