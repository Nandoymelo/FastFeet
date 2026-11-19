import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Fetch deliveryman (E2E)', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /deliveryman - admin pode buscar todos os entregadores', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    await Promise.all([
      userFactory.makePrismaUser({
        name: 'Bianca',
        role: 'DELIVERYMAN',
      }),
      userFactory.makePrismaUser({
        name: 'Fernando',
        role: 'DELIVERYMAN',
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/deliveryman')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      deliverymen: expect.arrayContaining([
        expect.objectContaining({ name: 'Bianca' }),
        expect.objectContaining({ name: 'Fernando' }),
      ]),
    })
  })
})
