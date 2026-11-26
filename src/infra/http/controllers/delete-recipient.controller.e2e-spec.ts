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

describe('Delete recipient (E2E)', () => {
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

  test('[DELETE] /recipient/:id - admin pode deletar destinatário', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const recipientId = recipient.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/recipient/${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const recipientOnDatabase = await prisma.recipient.findUnique({
      where: { id: recipientId },
    })

    expect(recipientOnDatabase).toBeNull()
  })

  test('[DELETE] /recipient/:id - retorna 403 caso entregador tente deletar um destinatário', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const recipientId = recipient.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/recipient/${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)

    const recipientOnDatabase = await prisma.recipient.findUnique({
      where: { id: recipientId },
    })

    expect(recipientOnDatabase).toEqual(
      expect.objectContaining({
        name: recipient.name,
        address: recipient.address,
        latitude: recipient.latitude,
        longitude: recipient.longitude,
      }),
    )
  })

  test('[DELETE] /recipient/:id - retorna 404 caso destinatário não exista', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .delete(`/recipient/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[DELETE] /recipient/:id - retorna 409 se o destinatário tiver pedidos', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient()
    await orderFactory.makePrismaOrder({ recipientId: recipient.id })

    const response = await request(app.getHttpServer())
      .delete(`/recipient/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)

    const recipientOnDatabase = await prisma.recipient.findUnique({
      where: { id: recipient.id.toString() },
    })

    expect(recipientOnDatabase).toBeTruthy()
  })
})
