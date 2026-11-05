import type { PaginationParams } from '@/core/repositories/pagination-params'
import { User } from '../entities/user'
import type { Cpf } from '../entities/value-object/cpf'

export abstract class UsersRepository {
  abstract findByCpf(cpf: Cpf): Promise<User | null>
  abstract findById(id: string): Promise<User | null>
  abstract findManyDeliverymen(params: PaginationParams): Promise<User[]>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
  abstract create(user: User): Promise<void>
}
