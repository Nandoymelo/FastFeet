import type { EventHandler } from '@/core/events/event-handler'
import { SendNotificationUseCase } from '../use-cases/send-notification'
import { DomainEvents } from '@/core/events/domain-events'
import { OrderChangeStatus } from '@/domain/fastFee/enterprise/events/order-change-status'
import type { OrderStatus } from '@/core/entities/order-status'

const messages: Record<OrderStatus, string> = {
  PENDING: 'Sua encomenda foi registrada.',
  AVAILABLE: 'Sua encomenda está disponível para retirada.',
  PICKED_UP: 'Sua encomenda foi retirada e está a caminho.',
  DELIVERED: 'Sua encomenda foi entregue.',
  RETURNED: 'Sua encomenda foi devolvida.',
}

export class OnOrderChangeStatus implements EventHandler {
  constructor(private sendNotification: SendNotificationUseCase) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendOrderStatusNotification.bind(this),
      OrderChangeStatus.name,
    )
  }

  private async sendOrderStatusNotification({ order }: OrderChangeStatus) {
    await this.sendNotification.execute({
      recipientId: order.recipientId.toString(),
      title: 'Atualização da sua encomenda',
      content: messages[order.status],
    })
  }
}
