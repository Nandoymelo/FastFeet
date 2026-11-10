import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrderAvailableUseCase } from './make-order-available'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '../../../../core/errors/order-status-transition-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: MakeOrderAvailableUseCase

describe('change the order available status.', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new MakeOrderAvailableUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be possible to change the order available status.', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.order.availableAt).toBeInstanceOf(Date)
    }
  })
  it('should not be possible to change the order pickuavailable status if not an admin', async () => {
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
    expect(order.availableAt).toBeUndefined()
  })
  it('should not be possible to change the available status of an order that doesnt exist.', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)
    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: 'not-exist',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
  })
  it('should not be possible to change the pickup status of an order that is already available', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({ availableAt: new Date() })

    const orginalAvailableAt = order.availableAt

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.availableAt).toEqual(orginalAvailableAt)
  })
})
