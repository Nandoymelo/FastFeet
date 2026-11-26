import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { FetchDeliverymanOrdersUseCase } from './fetch-deliveryman-orders'
import { MakeRecipient } from '@/test/factories/make-recipient'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let sut: FetchDeliverymanOrdersUseCase

describe('Fetch a deliveryman orders', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository(
      inMemoryRecipientRepository,
    )
    sut = new FetchDeliverymanOrdersUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
      inMemoryRecipientRepository,
    )
  })

  it('should be possible for a delivery person to pick up their deliveries.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const outherdeliveryman = makeUser({ role: 'DELIVERYMAN' })

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryUsersRepository.create(outherdeliveryman)

    await inMemoryOrderRepository.create(
      MakeOrder({
        createdAt: new Date(2026, 0, 1),
        deliverymanId: deliveryman.id,
      }),
    )
    await inMemoryOrderRepository.create(
      MakeOrder({
        createdAt: new Date(2026, 0, 2),
        deliverymanId: deliveryman.id,
      }),
    )
    await inMemoryOrderRepository.create(
      MakeOrder({
        createdAt: new Date(2026, 0, 3),
        deliverymanId: outherdeliveryman.id,
      }),
    )

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(2)
      expect(result.value.orders[0]?.createdAt).toEqual(new Date(2026, 0, 2))
      expect(
        result.value.orders.every(
          (order) =>
            order.deliverymanId?.toString() === deliveryman.id.toString(),
        ),
      ).toBe(true)
    }
  })
  it('should be able to fetch paginated orders for a deliveryman  ', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    await inMemoryUsersRepository.create(deliveryman)

    for (let i = 1; i <= 22; i++) {
      await inMemoryOrderRepository.create(
        MakeOrder({ deliverymanId: deliveryman.id }),
      )
    }

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(2)
    }
  })

  it('should return the recipient of each order', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()
    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryRecipientRepository.create(recipient)
    await inMemoryOrderRepository.create(
      MakeOrder({ recipientId: recipient.id, deliverymanId: deliveryman.id }),
    )

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toEqual([recipient])
    }
  })
})
