import { Order } from '@/domain/fastFee/enterprise/entities/order'
import { Recipient } from '@/domain/fastFee/enterprise/entities/recipient'
import { RecipientPresenter } from './recipient-presenter'

export class OrderPresenter {
  static toHTTP(order: Order) {
    return {
      id: order.id.toString(),
      recipientId: order.recipientId.toString(),
      deliverymanId: order.deliverymanId?.toString() ?? null,
      status: order.status,
      deliveryPhotoUrl: order.deliveryPhotoUrl ?? null,
      createdAt: order.createdAt,
      availableAt: order.availableAt ?? null,
      pickedUpAt: order.pickedUpAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
      returnedAt: order.returnedAt ?? null,
    }
  }

  static toHTTPWithRecipient(order: Order, recipients: Recipient[]) {
    const recipient = recipients.find((item) =>
      item.id.equals(order.recipientId),
    )

    return {
      ...OrderPresenter.toHTTP(order),
      recipient: recipient ? RecipientPresenter.toHTTP(recipient) : null,
    }
  }
}
