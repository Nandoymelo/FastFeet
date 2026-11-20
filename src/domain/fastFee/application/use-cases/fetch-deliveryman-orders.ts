import { left, right, type Either } from '@/core/types/either'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { Injectable } from '@nestjs/common'

interface FetchDeliverymanOrdersUseCaseRequest {
  deliverymanId: string
  page: number
}

type FetchDeliverymanOrdersUseCaseResponse = Either<
  NotAllowedError,
  {
    orders: Order[]
  }
>

@Injectable()
export class FetchDeliverymanOrdersUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    deliverymanId,
    page,
  }: FetchDeliverymanOrdersUseCaseRequest): Promise<FetchDeliverymanOrdersUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new NotAllowedError(deliveryman?.id.toString() ?? 'unknown'))
    }

    const orders = await this.ordersRepository.findManyByDeliverymanId(
      deliverymanId,
      { page },
    )
    return right({ orders })
  }
}
