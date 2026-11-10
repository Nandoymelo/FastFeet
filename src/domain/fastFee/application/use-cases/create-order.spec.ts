import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { CreateOrderUseCase } from './create-order'
import { InMemoryOrderRepository } from '@/test/repositories/in-memory-order-repository'
import { MakeRecipient } from '@/test/factories/make-recipient'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let inMemoryOrderRepository: InMemoryOrderRepository
let sut: CreateOrderUseCase

describe('Create Order', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    inMemoryOrderRepository = new InMemoryOrderRepository()
    sut = new CreateOrderUseCase(
      inMemoryUsersRepository,
      inMemoryRecipientRepository,
      inMemoryOrderRepository,
    )
  })

  it('should be able to create a order', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const recipient = MakeRecipient()

    inMemoryUsersRepository.items.push(admin)
    inMemoryRecipientRepository.items.push(recipient)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryOrderRepository.items).toHaveLength(1)
    if (result.isRight()) {
      expect(result.value.order.recipientId).toBeInstanceOf(UniqueEntityID)
    }
  })
  it('should not be able to create a order if you not an admin', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()

    inMemoryUsersRepository.items.push(user)
    inMemoryRecipientRepository.items.push(recipient)

    const result = await sut.execute({
      adminId: user.id.toString(),
      recipientId: recipient.id.toString(),
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryOrderRepository.items).toHaveLength(0)
  })
  it('should not be able to create a recipient if admin does not exist', async () => {
    const result = await sut.execute({
      adminId: 'non-existent',
      recipientId: 'not-exist',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
