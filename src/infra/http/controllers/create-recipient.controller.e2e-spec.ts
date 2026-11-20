import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

describe('Create Recipient (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /recipient - admin cria um destinatário', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const name = `Maria Souza ${randomUUID()}`

    const response = await request(app.getHttpServer())
      .post('/recipient')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        latitude: -23.5613,
        longitude: -46.6565,
      })

    expect(response.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: { name },
    })

    expect(recipientOnDatabase).toBeTruthy()
    expect(recipientOnDatabase?.address).toBe(
      'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    )
    expect(recipientOnDatabase?.latitude).toBe(-23.5613)
    expect(recipientOnDatabase?.longitude).toBe(-46.6565)
  })

  test('[POST] /recipient - entregador não pode criar um destinatário (403)', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const name = `Maria Souza ${randomUUID()}`

    const response = await request(app.getHttpServer())
      .post('/recipient')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        latitude: -23.5613,
        longitude: -46.6565,
      })

    expect(response.statusCode).toBe(403)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: { name },
    })

    expect(recipientOnDatabase).toBeNull()
  })

  test('[POST] /recipient - retorna 400 se a latitude estiver fora da faixa', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .post('/recipient')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Souza',
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        latitude: 91,
        longitude: -46.6565,
      })

    expect(response.statusCode).toBe(400)
  })
})
