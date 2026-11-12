import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events'
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { OnOrderChangeStatus } from '@/domain/notification/application/subscribre/on-order-change-status'
import { makeUser } from '@/test/factories/make-user'
import { MakeOrder } from '@/test/factories/make-order'
import { MakeRecipient } from '@/test/factories/make-recipient'

let sendNotification: SendNotificationUseCase

describe('On Order Change Status', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    sendNotification = {
      execute: vi.fn(),
    } as unknown as SendNotificationUseCase

    // eslint-disable-next-line no-new
    new OnOrderChangeStatus(sendNotification)
  })

  it('should be possible to send a notification when an order status changes to available for pickup.', async () => {
    const recipient = MakeRecipient()
    const order = MakeOrder({ recipientId: recipient.id })

    order.makeAvailable()

    await DomainEvents.dispatchEventsForAggregate(order.id)

    expect(sendNotification.execute).toHaveBeenCalledWith({
      recipientId: recipient.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda está disponível para retirada.',
    })
  })
  it('It should be possible to send a notification when the "picked up and on the way" status of an order is changed.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()
    const order = MakeOrder({
      recipientId: recipient.id,
      availableAt: new Date(),
    })

    order.pickUp(deliveryman.id)

    await DomainEvents.dispatchEventsForAggregate(order.id)

    expect(sendNotification.execute).toHaveBeenCalledWith({
      recipientId: recipient.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda foi retirada e está a caminho.',
    })
  })
  it('It should be possible to send a notification when an order status changes to delivered.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()
    const order = MakeOrder({
      deliverymanId: deliveryman.id,
      recipientId: recipient.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })

    order.delivered(deliveryman.id, 'fake-storage/delivery-photo.jpg')

    await DomainEvents.dispatchEventsForAggregate(order.id)

    expect(sendNotification.execute).toHaveBeenCalledWith({
      recipientId: recipient.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda foi entregue.',
    })
    expect(sendNotification.execute).toHaveBeenCalledTimes(1)
  })
  it('It should be possible to send a notification when an order status is changed to returned.', async () => {
    const deliveryman = makeUser({ role: 'DELIVERYMAN' })
    const recipient = MakeRecipient()
    const order = MakeOrder({
      deliverymanId: deliveryman.id,
      recipientId: recipient.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
    })

    order.returned(deliveryman.id)

    await DomainEvents.dispatchEventsForAggregate(order.id)

    expect(sendNotification.execute).toHaveBeenCalledWith({
      recipientId: recipient.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda foi devolvida.',
    })
  })
  it('should send notifications to different recipients', async () => {
    const recipient1 = MakeRecipient()
    const recipient2 = MakeRecipient()

    const order1 = MakeOrder({
      recipientId: recipient1.id,
    })

    const order2 = MakeOrder({
      recipientId: recipient2.id,
    })

    order1.makeAvailable()
    order2.makeAvailable()

    await DomainEvents.dispatchEventsForAggregate(order1.id)
    await DomainEvents.dispatchEventsForAggregate(order2.id)

    expect(sendNotification.execute).toHaveBeenCalledTimes(2)

    expect(sendNotification.execute).toHaveBeenNthCalledWith(1, {
      recipientId: recipient1.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda está disponível para retirada.',
    })

    expect(sendNotification.execute).toHaveBeenNthCalledWith(2, {
      recipientId: recipient2.id.toString(),
      title: 'Atualização da sua encomenda',
      content: 'Sua encomenda está disponível para retirada.',
    })
  })
})
