import { StorageProvider } from '@/domain/fastFee/application/storage/storage-provider'
import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { OrderFactory } from '@/test/factories/make-order'
import { UserFactory } from '@/test/factories/make-user'
import { FakeStorageProvider } from '@/test/storage/fake-storage-provider'
import { NotificationSender } from '@/domain/notification/application/gateways/notification-sender'
import { FakeNotificationSender } from '@/test/notification/fake-notification-sender'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Order status notifications (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let jwt: JwtService
  const sender = new FakeNotificationSender()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    })
      .overrideProvider(StorageProvider)
      .useValue(new FakeStorageProvider())
      .overrideProvider(NotificationSender)
      .useValue(sender)
      .compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  async function expectNotifications(recipientId: string, contents: string[]) {
    await vi.waitFor(async () => {
      const notifications = await prisma.notification.findMany({
        where: { recipientId },
        orderBy: { createdAt: 'asc' },
      })

      expect(notifications.map((item) => item.content)).toEqual(contents)
    })
  }

  test('o destinatário é notificado a cada mudança de status do pedido', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const adminToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })
    const deliverymanToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const order = await orderFactory.makePrismaOrder()
    const recipientId = order.recipientId.toString()
    const url = `/order/${order.id.toString()}`

    const patch = (action: string, token: string) =>
      request(app.getHttpServer())
        .patch(`${url}/${action}`)
        .set('Authorization', `Bearer ${token}`)

    const messages = [
      'Sua encomenda está disponível para retirada.',
      'Sua encomenda foi retirada e está a caminho.',
      'Sua encomenda foi entregue.',
      'Sua encomenda foi devolvida.',
    ]

    await patch('available', adminToken).expect(204)
    await expectNotifications(recipientId, messages.slice(0, 1))

    await patch('pickup', deliverymanToken).expect(204)
    await expectNotifications(recipientId, messages.slice(0, 2))

    await patch('deliver', deliverymanToken)
      .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg')
      .expect(204)
    await expectNotifications(recipientId, messages.slice(0, 3))

    await patch('return', deliverymanToken).expect(204)
    await expectNotifications(recipientId, messages)

    await vi.waitFor(() =>
      expect(sender.sent.map((item) => item.content)).toEqual(messages),
    )
  })

  test('uma mudança de status recusada não gera notificação', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })
    const order = await orderFactory.makePrismaOrder({
      availableAt: new Date(),
    })

    await request(app.getHttpServer())
      .patch(`/order/${order.id.toString()}/available`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)

    expect(
      await prisma.notification.count({
        where: { recipientId: order.recipientId.toString() },
      }),
    ).toBe(0)
  })
})
