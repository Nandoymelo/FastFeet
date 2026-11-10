import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { DeleteDeliverymanUseCase } from './delete-deliveryman'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: DeleteDeliverymanUseCase

describe('Delete a deliveryman', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new DeleteDeliverymanUseCase(inMemoryUsersRepository)
  })

  it('should be able delete a deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, deliveryman)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      deliverymanId: deliveryman.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
    expect(inMemoryUsersRepository.items).not.toContain(deliveryman)
    expect(inMemoryUsersRepository.items).toContain(admin)
  })
  it('should not be able delete a deliveryman if is not admin', async () => {
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

  it('should not be able to delete a deliveryman that doesnt exist ', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      deliverymanId: 'not-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
  })
  it('It shouldnt be possible to delete a delivery person if the admin doesnt exist.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      adminId: 'not-existent-id',
      deliverymanId: deliveryman.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items).toHaveLength(1)
    expect(inMemoryUsersRepository.items).toContain(deliveryman)
  })
})
