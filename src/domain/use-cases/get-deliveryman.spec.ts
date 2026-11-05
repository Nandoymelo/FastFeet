import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { GetDeliverymanUseCase } from './get-deliveryman'
import { NotAllowedError } from './errors/not-allowed-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: GetDeliverymanUseCase

describe('Get a deliveryman', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new GetDeliverymanUseCase(inMemoryUsersRepository)
  })

  it('should be able to get a deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, deliveryman)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      deliverymanId: deliveryman.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ user: deliveryman })
  })
  it('should not be able to get a deliveryman if is not admin', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, deliveryman)

    const result = await sut.execute({
      adminId: 'not admin',
      deliverymanId: deliveryman.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to get a deliveryman that doesnt exist ', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      deliverymanId: 'not-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
  it('It shouldnt be possible to get a deliveryman if the admin doesnt exist.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      adminId: 'not-existent-id',
      deliverymanId: deliveryman.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
