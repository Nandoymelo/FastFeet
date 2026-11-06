import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from './errors/not-allowed-error'
import { DeleteOrderUseCase } from './delete-order'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderCannotBeDeletedError } from './errors/order-cannot-delete-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: DeleteOrderUseCase

describe('Delete a order', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new DeleteOrderUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be able delete a order', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryOrderRepository.items).toHaveLength(0)
  })
  it('should not be able delete a order if is not admin', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(user)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: user.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be possible to edit an order that has already been picked up.', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({ pickedUpAt: new Date() })

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCannotBeDeletedError)
    expect(inMemoryOrderRepository.items).toHaveLength(1)
  })
})
