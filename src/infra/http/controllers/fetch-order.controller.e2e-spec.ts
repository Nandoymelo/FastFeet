import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { OrderFactory } from '@/test/factories/make-order'
import { RecipientFactory } from '@/test/factories/make-recipient'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Fetch order (E2E)', () => {
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

  test('[GET] /order - admin pode buscar todas as encomendas', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })
    const recipient = await recipientFactory.makePrismaRecipient()

    const [order1, order2] = await Promise.all([
      orderFactory.makePrismaOrder({ recipientId: recipient.id }),
      orderFactory.makePrismaOrder({ recipientId: recipient.id }),
    ])

    const response = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: order1.id.toString() }),
        expect.objectContaining({ id: order2.id.toString() }),
      ]),
    )
  })
  test('[GET] /order - deve rotar paginacao correta', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })
    const recipient = await recipientFactory.makePrismaRecipient()

    const orders = await Promise.all(
      Array.from({ length: 22 }, (_, index) =>
        orderFactory.makePrismaOrder({
          recipientId: recipient.id,
          createdAt: new Date(2026, 0, index + 1),
        }),
      ),
    )

    const response = await request(app.getHttpServer())
      .get('/order?page=2')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.orders).toHaveLength(2)
    const returnedIds = response.body.orders.map(
      (order: { id: string }) => order.id,
    )

    expect(returnedIds).toEqual([
      orders[1]?.id.toString(),
      orders[0]?.id.toString(),
    ])
  })

  test('[GET] /order - retorna 403 se um entregador tentar buscar as encomendas', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    await orderFactory.makePrismaOrder()

    const response = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
    expect(response.body.orders).toBeUndefined()
  })
})
