import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { CreateRecipientUseCase } from './create-recipient'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let sut: CreateRecipientUseCase

describe('create recipient', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    sut = new CreateRecipientUseCase(
      inMemoryRecipientRepository,
      inMemoryUsersRepository,
    )
  })

  it('should be able to create a recipient', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      name: 'Fernando Vinicius',
      address: 'lugar qualquer',
      longitude: 12345535,
      latitude: 2354345,
    })
    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipientRepository.items).toHaveLength(1)
    if (result.isRight()) {
      expect(result.value.recipient.name).toBe('Fernando Vinicius')
      expect(result.value.recipient.address).toBe('lugar qualquer')
    }
  })
  it('should not be able to create a recipient if you not an admin', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      adminId: user.id.toString(),
      name: 'Fernando Vinicius',
      address: 'lugar qualquer',
      longitude: 12345535,
      latitude: 2354345,
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryRecipientRepository.items).toHaveLength(0)
  })
  it('should not be able to create a recipient if admin does not exist', async () => {
    const result = await sut.execute({
      adminId: 'non-existent-id',
      name: 'Fernando Vinicius',
      address: 'lugar qualquer',
      longitude: 12345535,
      latitude: 2354345,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
