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

describe('Fetch order deliveryman (E2E)', () => {
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

  test('[GET] /order/ mine - o entregadors pode buscar todas as suas encomendas', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })
    const otherDeliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const recipient = await recipientFactory.makePrismaRecipient()

    const [order1, order2] = await Promise.all([
      orderFactory.makePrismaOrder({
        recipientId: recipient.id,
        deliverymanId: deliveryman.id,
      }),
      orderFactory.makePrismaOrder({
        recipientId: recipient.id,
        deliverymanId: deliveryman.id,
      }),
      orderFactory.makePrismaOrder({
        recipientId: recipient.id,
        deliverymanId: otherDeliveryman.id,
      }),
      orderFactory.makePrismaOrder({ recipientId: recipient.id }),
    ])

    const response = await request(app.getHttpServer())
      .get('/order/mine')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.orders).toHaveLength(2)
    expect(response.body.orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: order1.id.toString() }),
        expect.objectContaining({ id: order2.id.toString() }),
      ]),
    )
  })

  test('[GET] /order. mine - retorna 403 se um entregador tentar buscar as encomendas de outro entregador', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .get('/order/mine')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
    expect(response.body.orders).toBeUndefined()
  })
})
