import { StorageProvider } from '@/domain/fastFee/application/storage/storage-provider'
import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { OrderFactory } from '@/test/factories/make-order'
import { UserFactory } from '@/test/factories/make-user'
import { FakeStorageProvider } from '@/test/storage/fake-storage-provider'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('Deliver order (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let jwt: JwtService
  const storage = new FakeStorageProvider()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    })
      .overrideProvider(StorageProvider)
      .useValue(storage)
      .compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  beforeEach(() => {
    storage.uploads = []
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

  async function makePickedUpOrder() {
    const { user, accessToken } = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      deliverymanId: user.id,
      availableAt: new Date(),
      pickedUpAt: new Date(),
    })

    return { orderId: order.id.toString(), accessToken }
  }

  function deliver(orderId: string, accessToken: string) {
    return request(app.getHttpServer())
      .patch(`/order/${orderId}/deliver`)
      .set('Authorization', `Bearer ${accessToken}`)
  }

  async function expectNotDelivered(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })

    expect(order?.deliveredAt).toBeNull()
    expect(order?.deliveryPhotoUrl).toBeNull()
    expect(storage.uploads).toHaveLength(0)
  }

  test.each([
    ['JPEG', JPEG, 'photo.jpg', 'image/jpeg'],
    ['PNG', PNG, 'photo.png', 'image/png'],
  ])(
    '[PATCH] /order/:id/deliver - entregador entrega o pedido com foto %s',
    async (_format, content, fileName, contentType) => {
      const { orderId, accessToken } = await makePickedUpOrder()

      const response = await deliver(orderId, accessToken).attach(
        'photo',
        content,
        fileName,
      )

      expect(response.statusCode).toBe(204)
      expect(storage.uploads).toEqual([{ fileName, contentType }])

      const order = await prisma.order.findUnique({ where: { id: orderId } })

      expect(order?.deliveredAt).toBeInstanceOf(Date)
      expect(order?.deliveryPhotoUrl).toBe(`fake-storage/${fileName}`)
    },
  )

  test('[PATCH] /order/:id/deliver - retorna 400 sem a foto', async () => {
    const { orderId, accessToken } = await makePickedUpOrder()

    const response = await deliver(orderId, accessToken)

    expect(response.statusCode).toBe(400)
    await expectNotDelivered(orderId)
  })

  test('[PATCH] /order/:id/deliver - retorna 415 se o arquivo não for uma imagem', async () => {
    const { orderId, accessToken } = await makePickedUpOrder()

    const response = await deliver(orderId, accessToken).attach(
      'photo',
      Buffer.from('isto não é uma imagem'),
      { filename: 'photo.jpg', contentType: 'image/jpeg' },
    )

    expect(response.statusCode).toBe(415)
    await expectNotDelivered(orderId)
  })

  test('[PATCH] /order/:id/deliver - retorna 413 se a foto passar de 5 MB', async () => {
    const { orderId, accessToken } = await makePickedUpOrder()
    const tooBig = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)])

    const response = await deliver(orderId, accessToken).attach(
      'photo',
      tooBig,
      'photo.jpg',
    )

    expect(response.statusCode).toBe(413)
    await expectNotDelivered(orderId)
  })

  test('[PATCH] /order/:id/deliver - retorna 403 se outro entregador tentar entregar', async () => {
    const { orderId } = await makePickedUpOrder()
    const other = await makeDeliveryman()

    const response = await deliver(orderId, other.accessToken).attach(
      'photo',
      JPEG,
      'photo.jpg',
    )

    expect(response.statusCode).toBe(403)
    await expectNotDelivered(orderId)
  })

  test('[PATCH] /order/:id/deliver - retorna 409 se o pedido não foi retirado', async () => {
    const { accessToken } = await makeDeliveryman()
    const order = await orderFactory.makePrismaOrder({
      availableAt: new Date(),
    })

    const response = await deliver(order.id.toString(), accessToken).attach(
      'photo',
      JPEG,
      'photo.jpg',
    )

    expect(response.statusCode).toBe(409)
    await expectNotDelivered(order.id.toString())
  })

  test('[PATCH] /order/:id/deliver - retorna 404 se o pedido não existir', async () => {
    const { accessToken } = await makeDeliveryman()

    const response = await deliver(randomUUID(), accessToken).attach(
      'photo',
      JPEG,
      'photo.jpg',
    )

    expect(response.statusCode).toBe(404)
    expect(storage.uploads).toHaveLength(0)
  })
})
