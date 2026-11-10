import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { GetOrderUseCase } from './get-order'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderNotFoundError } from '../../../../core/errors/order-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: GetOrderUseCase

describe('Get a Order', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new GetOrderUseCase(inMemoryUsersRepository, inMemoryOrderRepository)
  })

  it('should be able to get a Order', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ order })
  })
  it('should not be able to get a order if is not admin', async () => {
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

  it('should not be able to get a order that doesnt exist ', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: 'not-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
  })
  it('should be able to get a Order already dispatched', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({ pickedUpAt: new Date() })

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ order })
  })
  it('should be able to get a Order already dispatched', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({ pickedUpAt: new Date(), deliveredAt: new Date() })

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ order })
  })
})
