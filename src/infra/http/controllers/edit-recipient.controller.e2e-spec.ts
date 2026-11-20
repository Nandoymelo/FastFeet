import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { RecipientFactory } from '@/test/factories/make-recipient'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

describe('Edit recipient (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let jwt: JwtService

  const newData = {
    name: 'Fernando Vinicius',
    address: 'Rua das Flores, 123 - Centro, Recife - PE',
    latitude: -8.0476,
    longitude: -34.877,
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[PUT] /recipient/:id - admin pode editar destinatário', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const recipientId = recipient.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/recipient/${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newData)

    expect(response.statusCode).toBe(204)

    const recipientOnDatabase = await prisma.recipient.findUnique({
      where: { id: recipientId },
    })

    expect(recipientOnDatabase).toEqual(expect.objectContaining(newData))
  })

  test('[PUT] /recipient/:id - retorna 403 caso entregador tente editar destinatário', async () => {
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
      .put(`/recipient/${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newData)

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

  test('[PUT] /recipient/:id - retorna 404 caso destinatário não exista', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .put(`/recipient/${randomUUID()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newData)

    expect(response.statusCode).toBe(404)
  })

  test('[PUT] /recipient/:id - retorna 400 caso a latitude esteja fora da faixa', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const recipient = await recipientFactory.makePrismaRecipient({})
    const recipientId = recipient.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/recipient/${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...newData, latitude: 91 })

    expect(response.statusCode).toBe(400)

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
})
