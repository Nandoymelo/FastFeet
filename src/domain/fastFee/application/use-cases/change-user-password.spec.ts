import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ChangeUserPasswordUseCase } from './change-user-password'
import { FakeHasher } from '@/test/cryptography/fake-hasher'
import { UserNotFoundError } from '../../../../core/errors/user-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let sut: ChangeUserPasswordUseCase

describe('change a password user', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    sut = new ChangeUserPasswordUseCase(inMemoryUsersRepository, fakeHasher)
  })

  it('should be able change a user password', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const user = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, user)

    const oldPassword = user.password

    const result = await sut.execute({
      adminId: admin.id.toString(),
      userId: user.id.toString(),
      password: 'new-password',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryUsersRepository.items[1]?.password).not.toEqual(oldPassword)
    expect(inMemoryUsersRepository.items[1]?.password).toEqual(
      'new-password-hashed',
    )
  })
  it('should not be able change a password if is not admin', async () => {
    const requester = makeUser({ role: 'DELIVERYMAN' })
    const user = makeUser({ role: 'DELIVERYMAN' })

    const oldPassword = user.password

    inMemoryUsersRepository.items.push(requester, user)

    const result = await sut.execute({
      adminId: requester.id.toString(),
      userId: user.id.toString(),
      password: 'new-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[1]?.password).toEqual(oldPassword)
  })
  it('should not be able to change a password if admin does not exist', async () => {
    const user = makeUser({ role: 'DELIVERYMAN' })

    const oldPassword = user.password

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      adminId: 'not-exist',
      userId: user.id.toString(),
      password: 'new-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[0]?.password).toEqual(oldPassword)
  })
  it('should not be able to change a password if user does not exist', async () => {
    const admin = makeUser({ role: 'ADMIN' })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      userId: 'not-exist',
      password: 'new-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
