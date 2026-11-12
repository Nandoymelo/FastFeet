import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { FetchNearbyOrdersUseCase } from './fetch-nearby-orders'
import { MakeRecipient } from '@/test/factories/make-recipient'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: FetchNearbyOrdersUseCase

describe('Fetch for nearby orders ', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository(
      inMemoryRecipientRepository,
    )
    sut = new FetchNearbyOrdersUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be able to fetch  orders', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    inMemoryUsersRepository.items.push(deliveryman)

    const nearRecipient = MakeRecipient({ latitude: 0.01, longitude: 0 })
    const farRecipient = MakeRecipient({ latitude: 1, longitude: 0 })
    inMemoryRecipientRepository.items.push(nearRecipient, farRecipient)

    const nearOrder = MakeOrder({
      recipientId: nearRecipient.id,
      availableAt: new Date(),
    })
    const farOrder = MakeOrder({
      recipientId: farRecipient.id,
      availableAt: new Date(),
    })
    inMemoryOrderRepository.items.push(nearOrder, farOrder)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      deliverymanLatitude: 0,
      deliverymanLongitude: 0,
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(1)
      expect(result.value.orders[0]?.id).toEqual(nearOrder.id)
    }
  })
  it('should not be able to fetch for orders that are not available. ', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    inMemoryUsersRepository.items.push(deliveryman)

    const nearRecipient = MakeRecipient({ latitude: 0.01, longitude: 0 })
    const farRecipient = MakeRecipient({ latitude: 0.01, longitude: 0 })
    inMemoryRecipientRepository.items.push(nearRecipient, farRecipient)

    const nearOrder = MakeOrder({
      recipientId: nearRecipient.id,
      availableAt: new Date(),
    })
    const farOrder = MakeOrder({
      recipientId: farRecipient.id,
    })
    inMemoryOrderRepository.items.push(nearOrder, farOrder)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      deliverymanLatitude: 0,
      deliverymanLongitude: 0,
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(1)
      expect(result.value.orders[0]?.id).toEqual(nearOrder.id)
    }
  })
  it('should return an empty list when there are no nearby orders', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    inMemoryUsersRepository.items.push(deliveryman)

    const nearRecipient = MakeRecipient({ latitude: 1, longitude: 0 })
    const farRecipient = MakeRecipient({ latitude: 1, longitude: 0 })
    inMemoryRecipientRepository.items.push(nearRecipient, farRecipient)

    const nearOrder = MakeOrder({
      recipientId: nearRecipient.id,
      availableAt: new Date(),
    })
    const farOrder = MakeOrder({
      recipientId: farRecipient.id,
      availableAt: new Date(),
    })
    inMemoryOrderRepository.items.push(nearOrder, farOrder)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      deliverymanLatitude: 0,
      deliverymanLongitude: 0,
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(0)
    }
  })
  it('should not be able to fetch orders if user is not a deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      deliverymanId: admin.id.toString(),
      deliverymanLatitude: 0,
      deliverymanLongitude: 0,
      page: 1,
    })

    expect(result.isLeft()).toBe(true)
  })
})
