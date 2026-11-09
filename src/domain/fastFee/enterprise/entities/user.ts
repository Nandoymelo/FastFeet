import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { UserRole } from '@/core/entities/user-role'
import type { Cpf } from './value-object/cpf'

export interface UserProps {
  cpf: Cpf
  name: string
  password: string
  role: UserRole
}

export class User extends Entity<UserProps> {
  get cpf() {
    return this.props.cpf
  }

  get name() {
    return this.props.name
  }

  get password() {
    return this.props.password
  }

  get role() {
    return this.props.role
  }

  set name(name: string) {
    this.props.name = name
  }

  set cpf(cpf: Cpf) {
    this.props.cpf = cpf
  }

  static create(props: UserProps, id?: UniqueEntityID) {
    return new User(props, id)
  }
}
