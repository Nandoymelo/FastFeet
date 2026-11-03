import type { User } from '@/domain/entities/user'
import type { Cpf } from '@/domain/entities/value-object/cpf'
import { UsersRepository } from '@/domain/repositories/user-repository'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findByCpf(cpf: Cpf) {
    const user = this.items.find((item) => item.cpf.equals(cpf))

    if (!user) {
      return null
    }

    return user
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
