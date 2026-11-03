import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { FakeHasher } from '@/test/cryptography/fake-hasher'
import { RegisterDeliverymanUseCase } from './register-deliveryman'
import { NotAllowedError } from './errors/not-allowed-error'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { makeUser } from '@/test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let sut: RegisterDeliverymanUseCase

describe('create user', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    sut = new RegisterDeliverymanUseCase(inMemoryUsersRepository, fakeHasher)
  })

  it('should be able to register a new deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      name: 'Fernando Vinicius',
      cpf: '529.982.247-25',
      password: '1234',
    })
    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items).toHaveLength(2)
    expect(inMemoryUsersRepository.items[1]).toMatchObject({
      name: 'Fernando Vinicius',
      role: 'DELIVERYMAN',
    })
    expect(result.value).toMatchObject({
      user: {
        name: 'Fernando Vinicius',
        role: 'DELIVERYMAN',
      },
    })
  })

  it('should hash the deliveryman password', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    await sut.execute({
      adminId: admin.id.toString(),
      name: 'Fernando Vinicius',
      cpf: '529.982.247-25',
      password: '1234',
    })

    expect(inMemoryUsersRepository.items[1]?.password).toBe('1234-hashed')
  })
  it('should not allow a non-admin to register a deliveryman', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      adminId: deliveryman.id.toString(),
      name: 'Fernando Vinicius',
      cpf: '529.982.247-25',
      password: '1234',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
  })
  it('should not register if the admin does not exist', async () => {
    const result = await sut.execute({
      adminId: 'non-existent-id',
      name: 'Fernando Vinicius',
      cpf: '111.444.777-35',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(0)
  })
  it('should not register a deliveryman with a duplicated CPF', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    await sut.execute({
      adminId: admin.id.toString(),
      name: 'Fernando Vinicius',
      cpf: '529.982.247-25',
      password: '1234',
    })

    const result = await sut.execute({
      adminId: admin.id.toString(),
      name: 'Outro Entregador',
      cpf: '529.982.247-25',
      password: '1234',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    expect(inMemoryUsersRepository.items).toHaveLength(2)
  })
})
