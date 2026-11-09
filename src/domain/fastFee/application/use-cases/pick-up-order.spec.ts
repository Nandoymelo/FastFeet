import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderStatusTransitionError } from './errors/order-status-transition-error'
import { PickUpOrderUseCase } from './pick-up-order'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: PickUpOrderUseCase

describe('change the order pickup status.', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new PickUpOrderUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be possible to change the order pickup status.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({ availableAt: new Date() })

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.order.pickedUpAt).toBeInstanceOf(Date)
    }
  })
  it('should not be possible to change the order pickup status if not an deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({ availableAt: new Date() })

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: admin.id.toString(),
      orderId: order.id.toString(),
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(order.pickedUpAt).toBeUndefined()
  })
  it('should not be possible to change the pickup status of an order that doesnt exist.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: 'not-exist',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
  })
  it('should not be possible to pick up an order that has already been picked up', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({ availableAt: new Date(), pickedUpAt: new Date() })

    const orginalPickedUpAt = order.pickedUpAt

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.pickedUpAt).toEqual(orginalPickedUpAt)
  })
})
