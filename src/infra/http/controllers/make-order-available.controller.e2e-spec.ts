import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { OrderFactory } from '@/test/factories/make-order'
import { RecipientFactory } from '@/test/factories/make-recipient'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

describe('Make order available (E2E)', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let orderFactory: OrderFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    recipientFactory = moduleRef.get(RecipientFactory)
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)
    prisma = moduleRef.get(PrismaService)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  beforeEach(async () => {
    await prisma.order.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[PATCH] /order/:id/available - admin torna o pedido disponível', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })
    const orderId = order.id.toString()

    const before = new Date()

    const response = await request(app.getHttpServer())
      .patch(`/order/${orderId}/available`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.availableAt).toBeInstanceOf(Date)
    expect(orderOnDatabase!.availableAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    )

    expect(orderOnDatabase).toEqual(
      expect.objectContaining({
        deliverymanId: null,
        pickedUpAt: null,
        deliveredAt: null,
        returnedAt: null,
      }),
    )

    const getResponse = await request(app.getHttpServer())
      .get(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(getResponse.body.order.status).toBe('AVAILABLE')
  })

  test('[PATCH] /order/:id/available - retorna 403 se um entregador tentar tornar o pedido disponível', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const order = await orderFactory.makePrismaOrder()
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .patch(`/order/${orderId}/available`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.availableAt).toBeNull()
  })

  test('[PATCH] /order/:id/available - retorna 404 se o pedido não existir', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .patch(`/order/${randomUUID()}/available`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[PATCH] /order/:id/available - retorna 409 se o pedido já estiver disponível', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const originalAvailableAt = new Date('2026-01-01T10:00:00.000Z')
    const order = await orderFactory.makePrismaOrder({
      availableAt: originalAvailableAt,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .patch(`/order/${orderId}/available`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.availableAt).toEqual(originalAvailableAt)
  })

  test('[PATCH] /order/:id/available - retorna 409 se o pedido já tiver sido retirado', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const order = await orderFactory.makePrismaOrder({
      deliverymanId: deliveryman.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })

    const response = await request(app.getHttpServer())
      .patch(`/order/${order.id.toString()}/available`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)
  })
})
