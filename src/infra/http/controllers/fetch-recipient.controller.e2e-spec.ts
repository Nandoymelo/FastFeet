import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { RecipientFactory } from '@/test/factories/make-recipient'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Fetch Recipient (E2E)', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  beforeEach(async () => {
    await prisma.recipient.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[FETCH] /recipient - admin pode buscar todos os destinatário', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    await Promise.all([
      recipientFactory.makePrismaRecipient({
        name: 'Bianca',
      }),
      recipientFactory.makePrismaRecipient({
        name: 'Fernando',
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/recipient')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      recipients: expect.arrayContaining([
        expect.objectContaining({ name: 'Bianca' }),
        expect.objectContaining({ name: 'Fernando' }),
      ]),
    })
  })
  test('[GET] /recipient - entregador não pode listar (403)', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const accessToken = jwt.sign({
      sub: deliveryman.id.toString(),
      role: 'DELIVERYMAN',
    })

    const response = await request(app.getHttpServer())
      .get('/recipient')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })
  test('[GET] /recipient - deve rotar paginacao correta', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    await Promise.all(
      Array.from({ length: 22 }, () =>
        recipientFactory.makePrismaRecipient({}),
      ),
    )

    const response = await request(app.getHttpServer())
      .get('/recipient?page=2')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.recipients).toHaveLength(2)
  })
})
