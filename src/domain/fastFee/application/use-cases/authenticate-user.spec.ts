import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { FakeHasher } from '@/test/cryptography/fake-hasher'
import { AuthenticateUseCase } from './authenticate-user'
import { makeUser } from '@/test/factories/make-user'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { Cpf } from '../../enterprise/entities/value-object/cpf'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let sut: AuthenticateUseCase

describe('authenticate user', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    sut = new AuthenticateUseCase(inMemoryUsersRepository, fakeHasher)
  })

  it('should be able to authenticate user', async () => {
    const user = makeUser({
      role: 'DELIVERYMAN',
      cpf: Cpf.create('529.982.247-25'),
      password: await fakeHasher.hash('1234'),
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      cpf: '529.982.247-25',
      password: '1234',
    })
    expect(result.isRight()).toBe(true)
  })
  it('should not authenticate with a CPF that does not exist', async () => {
    const result = await sut.execute({
      cpf: '529.982.247-25',
      password: '1234',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })
  it('should not authenticate with a wrong password', async () => {
    const user = makeUser({
      role: 'DELIVERYMAN',
      cpf: Cpf.create('529.982.247-25'),
      password: await fakeHasher.hash('1234'),
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      cpf: '529.982.247-25',
      password: '12345',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })
})
