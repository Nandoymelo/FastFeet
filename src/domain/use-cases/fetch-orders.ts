import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Order } from '../entities/order'
import { OrdersRepository } from '../repositories/orders-repository'

interface FetchOrdersUseCaseRequest {
  adminId: string
  page: number
}

type FetchOrdersUseCaseResponse = Either<
  NotAllowedError,
  {
    orders: Order[]
  }
>

export class FetchOrdersUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private orderRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    page,
  }: FetchOrdersUseCaseRequest): Promise<FetchOrdersUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)

    if (!admin || admin.role !== 'ADMIN') {
      return left(new NotAllowedError(admin?.id.toString() ?? 'unknown'))
    }

    const orders = await this.orderRepository.findManyOrder({
      page,
    })

    return right({ orders })
  }
}
