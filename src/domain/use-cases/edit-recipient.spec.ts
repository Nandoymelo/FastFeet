import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { EditRecipientUseCase } from './edit-recipient'
import { MakeRecipient } from '@/test/factories/make-recipient'
import { NotAllowedError } from './errors/not-allowed-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let sut: EditRecipientUseCase

describe('editar a recipient', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    sut = new EditRecipientUseCase(
      inMemoryUsersRepository,
      inMemoryRecipientRepository,
    )
  })

  it('should be able edit a recipient', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const recipient = MakeRecipient()

    inMemoryRecipientRepository.items.push(recipient)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: recipient.id.toString(),
      name: 'Fernando Melo',
      address: 'rua daqui de casa',
      longitude: 12345,
      latitude: 56789,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipient.name).toBe('Fernando Melo')
    }
  })
  it('should not be able to edit a recipient if you not an admin', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(user)

    const recipient = MakeRecipient()

    inMemoryRecipientRepository.items.push(recipient)

    const result = await sut.execute({
      adminId: user.id.toString(),
      recipientId: recipient.id.toString(),
      name: 'Fernando Melo',
      address: 'rua daqui de casa',
      longitude: 12345,
      latitude: 56789,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
  it('should not be able to edit a recipient that does not exist', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      recipientId: 'not exist',
      name: 'Fernando Melo',
      address: 'rua daqui de casa',
      longitude: 12345,
      latitude: 56789,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
  })
})
