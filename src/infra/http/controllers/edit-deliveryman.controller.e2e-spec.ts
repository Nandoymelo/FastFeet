import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserFactory } from '@/test/factories/make-user'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Edit deliveryman (E2E)', () => {
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

  test('[EDIT] /deliveryman - admin pode editar entregadores', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const acessToken = jwt.sign({ sub: admin.id.toString(), role: 'ADMIN' })

    const deliveryman = await userFactory.makePrismaUser({
      role: 'DELIVERYMAN',
    })
    const deliverymanId = deliveryman.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/deliveryman/${deliverymanId}`)
      .set('Authorization', `Bearer ${acessToken}`)
      .send({
        name: 'Fernando Vinicius',
        cpf: '529.982.247-25',
      })

    expect(response.statusCode).toBe(204)

    const deliverymanOnDatabase = await prisma.user.findFirst({
      where: {
        name: 'Fernando Vinicius',
        cpf: '52998224725',
      },
    })

    expect(deliverymanOnDatabase).toBeTruthy()
  })

  test('[PUT] /deliveryman/:id - retorna 403 para um entregador', async () => {
    const courier = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })
    const accessToken = jwt.sign({
      sub: courier.id.toString(),
      role: 'DELIVERYMAN',
    })
    const target = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })

    const response = await request(app.getHttpServer())
      .put(`/deliveryman/${target.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Nome Alterado', cpf: '390.533.447-05' })

    expect(response.statusCode).toBe(403)

    const targetOnDatabase = await prisma.user.findUnique({
      where: { id: target.id.toString() },
    })

    expect(targetOnDatabase?.name).toBe(target.name)
  })
})
