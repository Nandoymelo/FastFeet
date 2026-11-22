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

describe('Edit order (E2E)', () => {
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

  test('[PUT] /order/:id - admin pode trocar o destinatário de um pedido', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const oldRecipient = await recipientFactory.makePrismaRecipient()
    const newRecipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: oldRecipient.id,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: newRecipient.id.toString() })

    expect(response.statusCode).toBe(204)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.recipientId).toBe(newRecipient.id.toString())
  })

  test('[PUT] /order/:id - retorna 403 caso entregador tente editar um pedido', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const oldRecipient = await recipientFactory.makePrismaRecipient()
    const newRecipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: oldRecipient.id,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: newRecipient.id.toString() })

    expect(response.statusCode).toBe(403)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.recipientId).toBe(oldRecipient.id.toString())
  })

  test('[PUT] /order/:id - retorna 404 caso o pedido não exista', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient()

    const response = await request(app.getHttpServer())
      .put(`/order/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: recipient.id.toString() })

    expect(response.statusCode).toBe(404)
  })

  test('[PUT] /order/:id - retorna 404 caso o novo destinatário não exista', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const oldRecipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: oldRecipient.id,
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: randomUUID() })

    expect(response.statusCode).toBe(404)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.recipientId).toBe(oldRecipient.id.toString())
  })

  test('[PUT] /order/:id - retorna 409 caso o pedido já tenha sido retirado', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const oldRecipient = await recipientFactory.makePrismaRecipient()
    const newRecipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: oldRecipient.id,
      deliverymanId: deliveryman.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })
    const orderId = order.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: newRecipient.id.toString() })

    expect(response.statusCode).toBe(409)

    const orderOnDatabase = await prisma.order.findUnique({
      where: { id: orderId },
    })

    expect(orderOnDatabase?.recipientId).toBe(oldRecipient.id.toString())
  })

  test('[PUT] /order/:id - retorna 400 caso o recipientId seja inválido ou não seja enviado', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const order = await orderFactory.makePrismaOrder()
    const orderId = order.id.toString()

    const malformed = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: 'abc' })

    const missing = await request(app.getHttpServer())
      .put(`/order/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(malformed.statusCode).toBe(400)
    expect(missing.statusCode).toBe(400)
  })
})
