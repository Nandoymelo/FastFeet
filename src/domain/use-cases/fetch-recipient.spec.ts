import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { FetchRecipientUseCase } from './fetch-recipients'
import { InMemoryRecipientRepository } from '@/test/repositories/in-memory-recipient-repository'
import { MakeRecipient } from '@/test/factories/make-recipient'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientRepository: InMemoryRecipientRepository
let sut: FetchRecipientUseCase

describe('Fetch Recipients', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientRepository = new InMemoryRecipientRepository()
    sut = new FetchRecipientUseCase(
      inMemoryUsersRepository,
      inMemoryRecipientRepository,
    )
  })

  it('should be able to fetch  recipients', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientRepository.create(MakeRecipient())
    await inMemoryRecipientRepository.create(MakeRecipient())
    await inMemoryRecipientRepository.create(MakeRecipient())

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toHaveLength(3)
    }
  })
  it('should be able to fetch paginated recipients ', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    await inMemoryUsersRepository.create(admin)

    for (let i = 1; i <= 22; i++) {
      await inMemoryRecipientRepository.create(MakeRecipient())
    }

    const result = await sut.execute({
      adminId: admin.id.toString(),
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toHaveLength(2)
    }
  })
})
