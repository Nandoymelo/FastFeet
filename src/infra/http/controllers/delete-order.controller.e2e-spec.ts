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

describe('Delete order (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let orderFactory: OrderFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    orderFactory = moduleRef.get(OrderFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[DELETE] /order/:id - admin pode deletar uma encomenda', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase).toBeNull()
  })

  test('[DELETE] /order/:id - retorna 403 caso entregador tente deletar uma encomenda', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const recipient = await recipientFactory.makePrismaRecipient({})

    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase).toEqual(
      expect.objectContaining({
        id: order.id.toString(),
      }),
    )
  })

  test('[DELETE] /order/:id - retorna 404 caso a encomenda não exista', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .delete(`/order/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })
  test('[DELETE] /order/:id - retorna 409 caso admin tente deletar uma encomenda que já foi retirada ', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
      deliverymanId: deliveryman.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase).toEqual(
      expect.objectContaining({
        id: order.id.toString(),
      }),
    )
  })
})
