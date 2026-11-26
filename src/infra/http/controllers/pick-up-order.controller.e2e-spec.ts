import { OrdersRepository } from '@/domain/fastFee/application/repositories/orders-repository'
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

describe('Pick up order (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let ordersRepository: OrdersRepository
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
    ordersRepository = moduleRef.get(OrdersRepository)
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

  function pickUp(orderId: string, accessToken: string) {
    return request(app.getHttpServer())
      .patch(`/order/${orderId}/pickup`)
      .set('Authorization', `Bearer ${accessToken}`)
  }

  function findOrder(id: string) {
    return prisma.order.findUnique({ where: { id } })
  }

  test('[PATCH] /order/:id/pickup - entregador retira um pedido disponível', async () => {
    const { user, accessToken } = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      availableAt: new Date(),
    })
    const orderId = order.id.toString()

    const before = new Date()

    const response = await pickUp(orderId, accessToken)

    expect(response.statusCode).toBe(204)

    const orderOnDatabase = await findOrder(orderId)

    expect(orderOnDatabase!.pickedUpAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    )
    expect(orderOnDatabase?.deliverymanId).toBe(user.id.toString())
    expect(orderOnDatabase?.deliveredAt).toBeNull()
  })

  test('[PATCH] /order/:id/pickup - retorna 403 se um admin tentar retirar', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })
    const order = await orderFactory.makePrismaOrder({
      availableAt: new Date(),
    })

    const response = await pickUp(order.id.toString(), accessToken)

    expect(response.statusCode).toBe(403)
    expect((await findOrder(order.id.toString()))?.pickedUpAt).toBeNull()
  })

  test('[PATCH] /order/:id/pickup - retorna 409 se o pedido não estiver disponível', async () => {
    const { accessToken } = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder()

    const response = await pickUp(order.id.toString(), accessToken)

    expect(response.statusCode).toBe(409)

    const orderOnDatabase = await findOrder(order.id.toString())

    expect(orderOnDatabase?.pickedUpAt).toBeNull()
    expect(orderOnDatabase?.deliverymanId).toBeNull()
  })

  test('[PATCH] /order/:id/pickup - retorna 409 se outro entregador já retirou o pedido', async () => {
    const owner = await makeDeliveryman()
    const other = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      deliverymanId: owner.user.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })

    const response = await pickUp(order.id.toString(), other.accessToken)

    expect(response.statusCode).toBe(409)

    const orderOnDatabase = await findOrder(order.id.toString())

    expect(orderOnDatabase?.deliverymanId).toBe(owner.user.id.toString())
    expect(orderOnDatabase?.pickedUpAt).toEqual(order.pickedUpAt)
  })

  test('[PATCH] /order/:id/pickup - retorna 404 se o pedido não existir', async () => {
    const { accessToken } = await makeDeliveryman()

    const response = await pickUp(randomUUID(), accessToken)

    expect(response.statusCode).toBe(404)
  })

  test('duas retiradas a partir da mesma leitura: só a primeira é gravada e notificada', async () => {
    const first = await makeDeliveryman()
    const second = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      availableAt: new Date(),
    })
    const orderId = order.id.toString()

    const copyA = await ordersRepository.findById(orderId)
    const copyB = await ordersRepository.findById(orderId)
    copyA!.pickUp(first.user.id)
    copyB!.pickUp(second.user.id)

    expect(await ordersRepository.savePickUp(copyA!)).toBe(true)
    expect(await ordersRepository.savePickUp(copyB!)).toBe(false)

    expect((await findOrder(orderId))?.deliverymanId).toBe(
      first.user.id.toString(),
    )

    await vi.waitFor(async () => {
      expect(
        await prisma.notification.count({
          where: { recipientId: order.recipientId.toString() },
        }),
      ).toBe(1)
    })
  })
})
