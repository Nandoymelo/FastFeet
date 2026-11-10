import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '../../../../core/errors/order-status-transition-error'
import { ReturnOrderUseCase } from './return-order'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: ReturnOrderUseCase

describe('change order status to returned.', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new ReturnOrderUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be possible to change the order status to return.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
      deliverymanId: deliveryman.id,
    })

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.order.returnedAt).toBeInstanceOf(Date)
      expect(result.value.order.deliverymanId).toEqual(deliveryman.id)
    }
  })
  it('should not be possible to change the order status to returnerd if not an deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
      deliverymanId: admin.id,
    })

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: admin.id.toString(),
      orderId: order.id.toString(),
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(order.returnedAt).toBeUndefined()
  })
  it('should not be possible to change the status returned of an order that doesnt exist.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: 'not-exist',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
  })
  it('should not be possible to change the status of an order that has already been returned.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
      returnedAt: new Date(),
      deliverymanId: deliveryman.id,
    })

    const orginalReturnedAt = order.returnedAt

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.returnedAt).toEqual(orginalReturnedAt)
  })
  it('should not be possible to return an order that has not been picked up', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    const order = MakeOrder({
      availableAt: new Date(),
      deliverymanId: deliveryman.id,
    })

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.returnedAt).toBeUndefined()
  })
  it('should not be possible to return an order picked up by another deliveryman', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const anotherDeliveryman = makeUser({ role: 'DELIVERYMAN' })

    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
      deliverymanId: anotherDeliveryman.id,
    })

    inMemoryUsersRepository.items.push(deliveryman, anotherDeliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.returnedAt).toBeUndefined()
  })
})
