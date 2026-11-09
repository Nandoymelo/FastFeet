import { InMemoryUsersRepository } from '@/test/repositories/in-memory-deliveryman-repository'
import { EditDeliverymanUseCase } from './edit-deliveryman'
import { makeUser } from '@/test/factories/make-user'
import { NotAllowedError } from './errors/not-allowed-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: EditDeliverymanUseCase

describe('editar a deliveryman', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new EditDeliverymanUseCase(inMemoryUsersRepository)
  })

  it('should be able edit a deliveryman', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, deliveryman)

    const result = await sut.execute({
      adminId: admin.id.toString(),
      deliverymanId: deliveryman.id.toString(),
      name: 'Fernando Melo',
      cpf: '529.982.247-25',
    })

    expect(result.isRight()).toBe(true)
    expect(deliveryman.name).toBe('Fernando Melo')
    expect(deliveryman.cpf.value).toBe('52998224725')
  })
  it('should not be able iedit a deliveryman if is not admin', async () => {
    const admin = makeUser({ role: 'ADMIN' })
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })

    inMemoryUsersRepository.items.push(admin, deliveryman)

    const result = await sut.execute({
      adminId: 'not admin',
      deliverymanId: deliveryman.id.toString(),
      name: 'Fernando Melo',
      cpf: '529.982.247-25',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
