import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { FetchOrdersUseCase } from './fetch-orders'
import { MakeOrder } from '@/test/factories/make-order'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: FetchOrdersUseCase

describe('Fetch orders', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new FetchOrdersUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be able to fetch  orders', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)
    await inMemoryOrderRepository.create(MakeOrder())
    await inMemoryOrderRepository.create(MakeOrder())
    await inMemoryOrderRepository.create(MakeOrder())

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(3)
    }
  })
  it('should be able to fetch paginated orders ', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)

    for (let i = 1; i <= 22; i++) {
      await inMemoryOrderRepository.create(MakeOrder())
    }

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(2)
    }
  })
})
