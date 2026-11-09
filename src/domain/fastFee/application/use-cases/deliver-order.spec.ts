import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderStatusTransitionError } from './errors/order-status-transition-error'
import { DeliverOrderUseCase } from './deliver-order'
import { FakeStorageProvider } from '@/test/storage/fake-storage-provider'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let fakeStorageProvider: FakeStorageProvider
let sut: DeliverOrderUseCase

describe('change order status to delivered.', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    fakeStorageProvider = new FakeStorageProvider()
    sut = new DeliverOrderUseCase(
      inMemoryUsersRepository,
      inMemoryOrderRepository,
      fakeStorageProvider,
    )
  })

  it('should be possible to change the order status to delivered.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliverymanId: deliveryman.id,
    })

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const photo = {
      buffer: Buffer.from('fake image content'),
      fileName: 'delivery-photo.jpg',
      contentType: 'image/jpeg',
    }

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
      photo,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.order.deliveredAt).toBeInstanceOf(Date)
      expect(result.value.order.deliveryPhotoUrl).toBe(
        'fake-storage/delivery-photo.jpg',
      )
      expect(result.value.order.deliverymanId).toEqual(deliveryman.id)
      expect(fakeStorageProvider.uploads).toHaveLength(1)

      expect(fakeStorageProvider.uploads[0]).toEqual({
        fileName: 'delivery-photo.jpg',
        contentType: 'image/jpeg',
      })
    }
  })
  it('should not be possible to change the order status to delivered if not an deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliverymanId: admin.id,
    })
    const photo = {
      buffer: Buffer.from('fake image content'),
      fileName: 'delivery-photo.jpg',
      contentType: 'image/jpeg',
    }

    inMemoryUsersRepository.items.push(admin)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: admin.id.toString(),
      orderId: order.id.toString(),
      photo,
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(order.deliveredAt).toBeUndefined()
    expect(fakeStorageProvider.uploads).toHaveLength(0)
  })
  it('should not be possible to change the status of an order that doesnt exist.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const photo = {
      buffer: Buffer.from('fake image content'),
      fileName: 'delivery-photo.jpg',
      contentType: 'image/jpeg',
    }

    inMemoryUsersRepository.items.push(deliveryman)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: 'not-exist',
      photo,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
  })
  it('should not be possible to pick up an order that has already been delivered', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const order = MakeOrder({
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliverymanId: deliveryman.id,
      deliveredAt: new Date(),
    })

    const orginalDeliveredAt = order.deliveredAt

    const photo = {
      buffer: Buffer.from('fake image content'),
      fileName: 'delivery-photo.jpg',
      contentType: 'image/jpeg',
    }

    inMemoryUsersRepository.items.push(deliveryman)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      deliverymanId: deliveryman.id.toString(),
      orderId: order.id.toString(),
      photo,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderStatusTransitionError)
    expect(order.deliveredAt).toEqual(orginalDeliveredAt)
  })
})
