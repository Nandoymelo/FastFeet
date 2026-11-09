import { User, type UserProps } from '@/domain/fastFee/enterprise/entities/user'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import { faker } from '@faker-js/faker'
import { generateCpf } from '../utils/generate-cpf'

export function makeUser(override: Partial<UserProps> = {}) {
  const admin = User.create({
    name: faker.person.fullName(),
    cpf: Cpf.create(generateCpf()),
    password: faker.internet.password(),
    role: 'ADMIN',
    ...override,
  })

  return admin
}
