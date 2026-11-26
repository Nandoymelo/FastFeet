import { InMemoryNotificationsRepository } from '@/test/repositories/in-memory-notifications-repository'
import { SendNotificationUseCase } from './send-notification'
import { FakeNotificationSender } from '@/test/notification/fake-notification-sender'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let fakeNotificationSender: FakeNotificationSender
let sut: SendNotificationUseCase

describe('Send Notification', () => {
  beforeEach(() => {
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    fakeNotificationSender = new FakeNotificationSender()
    sut = new SendNotificationUseCase(
      inMemoryNotificationsRepository,
      fakeNotificationSender,
    )
  })

  it('should be able to send a notification', async () => {
    const result = await sut.execute({
      recipientId: '1',
      title: 'Nova notificação',
      content: 'Conteúdo da notificação',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      result.value?.notification,
    )
    expect(fakeNotificationSender.sent).toEqual([result.value?.notification])
  })
})
