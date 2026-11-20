import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { compare } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import request from 'supertest'

describe('Change user password (E2E)', () => {
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

  test('[PATCH] /deliveryman/:id/password - admin pode mudar a senha dos entregadores', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const acessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const deliverymanId = deliveryman.id.toString()

    const response = await request(app.getHttpServer())
      .patch(`/deliveryman/${deliverymanId}/password`)
      .set('Authorization', `Bearer ${acessToken}`)
      .send({
        password: '123456',
      })

    expect(response.statusCode).toBe(204)

    const deliverymanOnDatabase = await prisma.user.findFirst({
      where: {
        id: deliverymanId,
      },
    })

    expect(deliverymanOnDatabase).toBeTruthy()
    expect(await compare('123456', deliverymanOnDatabase!.passwordHash)).toBe(
      true,
    )
  })

  test('[PATCH] /deliveryman/:id/password - entregador não pode mudar a senha (403)', async () => {
    const notAdmin = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })

    const accessToken = jwt.sign({
      sub: notAdmin.id.toString(),
      role: 'DELIVERYMAN',
    })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const deliverymanId = deliveryman.id.toString()

    const response = await request(app.getHttpServer())
      .patch(`/deliveryman/${deliverymanId}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: '123456',
      })

    expect(response.statusCode).toBe(403)

    const deliverymanOnDatabase = await prisma.user.findUnique({
      where: { id: deliverymanId },
    })

    expect(deliverymanOnDatabase!.passwordHash).toBe(deliveryman.password)
  })

  test('[PATCH] /deliveryman/:id/password - retorna 404 se o usuário não existir', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const accessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const response = await request(app.getHttpServer())
      .patch(`/deliveryman/${randomUUID()}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: '123456',
      })

    expect(response.statusCode).toBe(404)
  })
})
