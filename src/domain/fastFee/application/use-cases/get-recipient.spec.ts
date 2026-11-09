import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from './errors/not-allowed-error'
import { GetRecipientUseCase } from './get-recipient'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { MakeRecipient } from '@/test/factories/make-recipient'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let sut: GetRecipientUseCase

describe('Get a recipient', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    sut = new GetRecipientUseCase(
      inMemoryUsersRepository,
      inMemoryRecipientRepository,
    )
  })

  it('should be able to get a recipient', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const recipient = MakeRecipient({ name: 'Fernando' })

    inMemoryUsersRepository.items.push(admin)
    inMemoryRecipientRepository.items.push(recipient)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipient.name).toBe('Fernando')
    }
  })
  it('should not be able to get a recipient if is not admin', async () => {
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
  })

  it('should not be able to get a recipient that doesnt exist ', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: 'not-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
  })
})
