import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { execSync } from 'node:child_process'
import request from 'supertest'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    execSync('npx prisma db seed', { stdio: 'inherit' })

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /deliverymen - admin cria um entregador', async () => {
    // Autentica como o admin criado pelo seed
    const session = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '117.569.880-64',
      password: '12345',
    })

    const accessToken = session.body.access_token

    const response = await request(app.getHttpServer())
      .post('/deliverymen')
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
})
