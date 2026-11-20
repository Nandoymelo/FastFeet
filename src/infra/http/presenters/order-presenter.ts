import { Order } from '@/domain/fastFee/enterprise/entities/order'

export class OrderPresenter {
  static toHTTP(order: Order) {
    // Campos opcionais saem como null (e não ausentes), para o contrato da
    // resposta ter sempre o mesmo formato. As datas viram ISO 8601 no JSON.
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
}
