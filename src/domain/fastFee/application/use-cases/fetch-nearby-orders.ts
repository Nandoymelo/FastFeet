import { left, right, type Either } from '@/core/types/either'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

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
  }
>
const MAX_DISTANCE_IN_KM = 10
export class FetchNearbyOrdersUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
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

    return right({ orders })
  }
}
