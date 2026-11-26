import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Get deliveryman (E2E)', () => {
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

  test('[GET] /deliveryman/:id - admin busca um entregador', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })

    const response = await request(app.getHttpServer())
      .get(`/deliveryman/${deliveryman.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.deliveryman).toEqual(
      expect.objectContaining({
        id: deliveryman.id.toString(),
        name: deliveryman.name,
      }),
    )
  })

  test('[GET] /deliveryman/:id - retorna 403 para um entregador', async () => {
    const courier = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })
    const accessToken = jwt.sign({
      sub: courier.id.toString(),
      role: 'DELIVERYMAN',
    })
    const target = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })

    const response = await request(app.getHttpServer())
      .get(`/deliveryman/${target.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
    expect(response.body.deliveryman).toBeUndefined()
  })
})
