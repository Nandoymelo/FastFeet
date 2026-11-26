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

describe('Fetch nearby orders (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let orderFactory: OrderFactory
  let jwt: JwtService

  // Posição do entregador (Av. Paulista, São Paulo)
  const me = { latitude: -23.5613, longitude: -46.6565 }

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

  beforeEach(async () => {
    await prisma.order.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  async function makeDeliverymanToken() {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })

    return jwt.sign({ sub: deliveryman.id.toString(), role: 'DELIVERYMAN' })
  }

  test('[GET] /order/nearby - entregador vê os pedidos disponíveis num raio de 10 km, do mais próximo ao mais distante', async () => {
    const accessToken = await makeDeliverymanToken()
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })

    const near = await recipientFactory.makePrismaRecipient({
      latitude: -23.5629,
      longitude: -46.6544,
    }) // ~0,3 km
    const mid = await recipientFactory.makePrismaRecipient({
      latitude: -23.5505,
      longitude: -46.6333,
    }) // ~2,7 km
    const far = await recipientFactory.makePrismaRecipient({
      latitude: -22.9068,
      longitude: -43.1729,
    }) // ~360 km (Rio de Janeiro)

    // Criado de propósito fora de ordem de distância
    const midOrder = await orderFactory.makePrismaOrder({
      recipientId: mid.id,
      availableAt: new Date(),
    })
    const nearOrder = await orderFactory.makePrismaOrder({
      recipientId: near.id,
      availableAt: new Date(),
    })

    // Não devem aparecer:
    await orderFactory.makePrismaOrder({
      recipientId: far.id,
      availableAt: new Date(),
    }) // longe demais
    await orderFactory.makePrismaOrder({ recipientId: near.id }) // ainda não disponível
    await orderFactory.makePrismaOrder({
      recipientId: near.id,
      deliverymanId: deliveryman.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    }) // já retirado

    const response = await request(app.getHttpServer())
      .get(`/order/nearby?latitude=${me.latitude}&longitude=${me.longitude}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    const returnedIds = response.body.orders.map(
      (order: { id: string }) => order.id,
    )

    expect(returnedIds).toEqual([
      nearOrder.id.toString(),
      midOrder.id.toString(),
    ])
    expect(
      response.body.orders.map(
        (order: { recipient: { address: string } }) => order.recipient.address,
      ),
    ).toEqual([near.address, mid.address])
  })

  test('[GET] /order/nearby - respeita a paginação', async () => {
    const accessToken = await makeDeliverymanToken()

    const recipient = await recipientFactory.makePrismaRecipient({
      latitude: -23.5629,
      longitude: -46.6544,
    })

    await Promise.all(
      Array.from({ length: 22 }, () =>
        orderFactory.makePrismaOrder({
          recipientId: recipient.id,
          availableAt: new Date(),
        }),
      ),
    )

    const response = await request(app.getHttpServer())
      .get(
        `/order/nearby?latitude=${me.latitude}&longitude=${me.longitude}&page=2`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.orders).toHaveLength(2)
  })

  test('[GET] /order/nearby - retorna 403 se um admin tentar buscar', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient({
      latitude: -23.5629,
      longitude: -46.6544,
    })
    await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
      availableAt: new Date(),
    })

    const response = await request(app.getHttpServer())
      .get(`/order/nearby?latitude=${me.latitude}&longitude=${me.longitude}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
    expect(response.body.orders).toBeUndefined()
  })

  test.each([
    ['latitude fora da faixa', 'latitude=91&longitude=-46.6565'],
    ['longitude fora da faixa', 'latitude=-23.5613&longitude=181'],
    ['latitude não numérica', 'latitude=abc&longitude=-46.6565'],
    ['latitude vazia', 'latitude=&longitude=-46.6565'],
    ['longitude ausente', 'latitude=-23.5613'],
    ['sem coordenadas', ''],
    ['page inválida', 'latitude=-23.5613&longitude=-46.6565&page=0'],
  ])(
    '[GET] /order/nearby - retorna 400 com %s',
    async (_description, queryString) => {
      const accessToken = await makeDeliverymanToken()

      const response = await request(app.getHttpServer())
        .get(`/order/nearby?${queryString}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(400)
    },
  )
})
