import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { FetchDeliverymenUseCase } from './fetch-deliveryman'
import { makeUser } from '@/test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: FetchDeliverymenUseCase

describe('Fetch deliverymens', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new FetchDeliverymenUseCase(inMemoryUsersRepository)
  })

  it('should be able to fetch  deliverymens', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(makeUser({ role: 'ADMIN' }))
    await inMemoryUsersRepository.create(makeUser({ role: 'DELIVERYMAN' }))
    await inMemoryUsersRepository.create(makeUser({ role: 'DELIVERYMAN' }))
    await inMemoryUsersRepository.create(makeUser({ role: 'DELIVERYMAN' }))

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 1,
    })

    if (result.isRight()) {
      expect(result.value.users).toHaveLength(3)
      expect(result.value.users).not.toContain(admin)
    }
  })
  it('should be able to fetch paginated deliverymens ', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)

    for (let i = 1; i <= 22; i++) {
      await inMemoryUsersRepository.create(makeUser({ role: 'DELIVERYMAN' }))
    }

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.users).toHaveLength(2)
      expect(result.value.users).not.toContain(admin)
    }
  })
})
