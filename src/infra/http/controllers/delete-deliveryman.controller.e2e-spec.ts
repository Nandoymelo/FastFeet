import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Delete deliveryman (E2E)', () => {
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

  test('[DELETE] /deliveryman - admin pode deletar entregadores', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const acessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const deliverymanId = deliveryman.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/deliveryman/${deliverymanId}`)
      .set('Authorization', `Bearer ${acessToken}`)

    expect(response.statusCode).toBe(204)

    const deliverymanOnDatabase = await prisma.user.findUnique({
      where: {
        id: deliverymanId,
      },
    })

    expect(deliverymanOnDatabase).toBeNull()
  })
})
