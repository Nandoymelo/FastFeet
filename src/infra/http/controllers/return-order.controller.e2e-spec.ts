import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { OrderFactory } from '@/test/factories/make-order'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

describe('Return order (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

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

  async function makeDeliveryman() {
    const user = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })
    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: 'DELIVERYMAN',
    })

    return { user, accessToken }
  }

  function makeDeliveredOrder(
    deliverymanId: Awaited<ReturnType<typeof makeDeliveryman>>['user']['id'],
  ) {
    return orderFactory.makePrismaOrder({
      deliverymanId,
      availableAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
    })
  }

  function findOrder(id: string) {
    return prisma.order.findUnique({ where: { id } })
  }

  test('[PATCH] /order/:id/return - entregador devolve um pedido entregue por ele', async () => {
    const { user, accessToken } = await makeDeliveryman()
    const order = await makeDeliveredOrder(user.id)
    const orderId = order.id.toString()

    const before = new Date()

    const response = await request(app.getHttpServer())
      .patch(`/order/${orderId}/return`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const orderOnDatabase = await findOrder(orderId)

    expect(orderOnDatabase!.returnedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    )
    expect(orderOnDatabase?.deliveredAt).toEqual(order.deliveredAt)
  })

  test('[PATCH] /order/:id/return - retorna 403 se um admin tentar devolver', async () => {
    const { user } = await makeDeliveryman()
    const order = await makeDeliveredOrder(user.id)
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .patch(`/order/${order.id.toString()}/return`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
    expect((await findOrder(order.id.toString()))?.returnedAt).toBeNull()
  })

  test('[PATCH] /order/:id/return - retorna 409 se o pedido for de outro entregador', async () => {
    const owner = await makeDeliveryman()
    const other = await makeDeliveryman()
    const order = await makeDeliveredOrder(owner.user.id)

    const response = await request(app.getHttpServer())
      .patch(`/order/${order.id.toString()}/return`)
      .set('Authorization', `Bearer ${other.accessToken}`)

    expect(response.statusCode).toBe(409)
    expect((await findOrder(order.id.toString()))?.returnedAt).toBeNull()
  })

  test('[PATCH] /order/:id/return - retorna 409 se o pedido ainda não foi entregue', async () => {
    const { user, accessToken } = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      deliverymanId: user.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })

    const response = await request(app.getHttpServer())
      .patch(`/order/${order.id.toString()}/return`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)
    expect((await findOrder(order.id.toString()))?.returnedAt).toBeNull()
  })

  test('[PATCH] /order/:id/return - retorna 404 se o pedido não existir', async () => {
    const { accessToken } = await makeDeliveryman()

    const response = await request(app.getHttpServer())
      .patch(`/order/${randomUUID()}/return`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })
})
