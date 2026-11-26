import { left, right, type Either } from '@/core/types/either'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Injectable } from '@nestjs/common'
import { RecipientRepository } from '../repositories/recipients-repository'
import { Recipient } from '../../enterprise/entities/recipient'

interface FetchNearbyOrdersUseCaseRequest {
  deliverymanId: string
  page: number
  deliverymanLatitude: number
  deliverymanLongitude: number
}

type FetchNearbyOrdersUseCaseResponse = Either<
  NotAllowedError,
  {
    orders: Order[]
    recipients: Recipient[]
  }
>
const MAX_DISTANCE_IN_KM = 10
@Injectable()
export class FetchNearbyOrdersUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
    private recipientsRepository: RecipientRepository,
  ) {}

  async execute({
    deliverymanId,
    page,
    deliverymanLatitude,
    deliverymanLongitude,
  }: FetchNearbyOrdersUseCaseRequest): Promise<FetchNearbyOrdersUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new NotAllowedError(deliveryman?.id.toString() ?? 'unknown'))
    }

    const orders = await this.ordersRepository.findManyAvailableNearby(
      {
        latitude: deliverymanLatitude,
        longitude: deliverymanLongitude,
        maxDistanceInKm: MAX_DISTANCE_IN_KM,
      },
      { page },
    )

    // o entregador precisa do endereço de cada pedido listado
    const recipients = await this.recipientsRepository.findManyByIds(
      orders.map((order) => order.recipientId.toString()),
    )

    return right({ orders, recipients })
  }
}
