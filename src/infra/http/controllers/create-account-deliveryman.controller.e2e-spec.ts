import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UserFactory } from '@/test/factories/make-user'
import { JwtService } from '@nestjs/jwt'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execSync } from 'node:child_process'
import request from 'supertest'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let jwt: JwtService

  beforeAll(async () => {
    execSync('npx prisma db seed', { stdio: 'inherit' })

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

  test('[POST] /deliveryman - admin cria um entregador', async () => {
    // Autentica como o admin criado pelo seed
    const session = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '117.569.880-64',
      password: '12345',
    })

    const accessToken = session.body.access_token

    const response = await request(app.getHttpServer())
      .post('/deliveryman')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Fernando Vinicius',
        cpf: '529.982.247-25', // CPF válido, diferente do admin
        password: '123456',
      })

    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.user.findUnique({
      where: { cpf: '52998224725' }, // salvo normalizado
    })

    expect(userOnDatabase).toBeTruthy()
    expect(userOnDatabase?.role).toBe('DELIVERYMAN')
  })

  test('[POST] /deliveryman - retorna 403 para um entregador', async () => {
    const courier = await userFactory.makePrismaUser({ role: 'DELIVERYMAN' })
    const accessToken = jwt.sign({
      sub: courier.id.toString(),
      role: 'DELIVERYMAN',
    })

    const response = await request(app.getHttpServer())
      .post('/deliveryman')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Intruso', cpf: '390.533.447-05', password: '123456' })

    expect(response.statusCode).toBe(403)

    const userOnDatabase = await prisma.user.findUnique({
      where: { cpf: '39053344705' },
    })

    expect(userOnDatabase).toBeNull()
  })
})
