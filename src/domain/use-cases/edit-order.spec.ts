import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { MakeRecipient } from '@/test/factories/make-recipient'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeOrder } from '@/test/factories/make-order'
import { EditOrderUseCase } from './edit-order'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: EditOrderUseCase

describe('Edite a Order', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new EditOrderUseCase(
      inMemoryUsersRepository,
      inMemoryRecipientRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be able edit a order', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const recipient = MakeRecipient()
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(admin)
    inMemoryRecipientRepository.items.push(recipient)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: recipient.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryOrderRepository.items[0]?.recipientId).toEqual(recipient.id)
  })
  it('should not be possible to edit an order that has already been picked up.', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const recipient = MakeRecipient()
    const order = MakeOrder({ pickedUpAt: new Date() })

    inMemoryUsersRepository.items.push(admin)
    inMemoryRecipientRepository.items.push(recipient)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: recipient.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(order.recipientId).not.toEqual(recipient.id)
  })
  it('should not be possible to edit an order, unless you are an admin.', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()
    const order = MakeOrder()

    inMemoryUsersRepository.items.push(user)
    inMemoryRecipientRepository.items.push(recipient)
    inMemoryOrderRepository.items.push(order)

    const result = await sut.execute({
      adminId: user.id.toString(),
      recipientId: recipient.id.toString(),
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
