import { left, right, type Either } from '@/core/types/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { UsersRepository } from '../repositories/user-repository'
import { NotAllowedError } from './errors/not-allowed-error'
import { Order } from '../../enterprise/entities/order'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderStatusTransitionError } from './errors/order-status-transition-error'
import { DeliveryPhotoRequiredError } from './errors/delivery-photo-required-error'
import type { StorageProvider } from '../storage/storage-provider'

interface DeliverOrderUseCaseRequest {
  deliverymanId: string
  orderId: string
  photo: {
    buffer: Buffer
    fileName: string
    contentType: string
  }
}

type DeliverOrderUseCaseResponse = Either<
  | NotAllowedError
  | OrderNotFoundError
  | OrderStatusTransitionError
  | DeliveryPhotoRequiredError,
  {
    order: Order
  }
>

export class DeliverOrderUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
    private storageProvider: StorageProvider,
  ) {}

  async execute({
    deliverymanId,
    orderId,
    photo,
  }: DeliverOrderUseCaseRequest): Promise<DeliverOrderUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)

    if (!deliveryman || deliveryman.role !== 'DELIVERYMAN') {
      return left(new NotAllowedError(deliveryman?.id.toString() ?? 'unknown'))
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError(orderId))
    }

    if (!order.canBeDelivered()) {
      return left(new OrderStatusTransitionError())
    }

    if (!photo.buffer || photo.buffer.length === 0) {
      return left(new DeliveryPhotoRequiredError())
    }

    const photoUrl = await this.storageProvider.upload(
      photo.buffer,
      photo.fileName,
      photo.contentType,
    )

    order.delivered(deliveryman.id, photoUrl)

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
