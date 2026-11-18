import { execSync } from 'node:child_process'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { hash } from 'bcryptjs'
import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import { UserFactory } from '@/test/factories/make-user'

describe('Authenticate (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    // Cria o admin exatamente como o seed.ts faz (se já existir, ele não duplica)
    execSync('npx prisma db seed', { stdio: 'inherit' })

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /sessions - admin do seed recebe um token', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '117.569.880-64',
      password: '12345',
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })

    // O token é válido (assinatura confere) e pertence a um ADMIN
    const payload = jwt.verify(response.body.access_token)
    expect(payload.role).toBe('ADMIN')
  })

  test('[POST] /sessions - entregador recebe token com role DELIVERYMAN', async () => {
    const deliveryman = await userFactory.makePrismaUser({
      cpf: Cpf.create('529.982.247-25'),
      password: await hash('123456', 8),
      role: 'DELIVERYMAN',
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '529.982.247-25',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })

    const payload = jwt.verify(response.body.access_token)
    expect(payload).toEqual(
      expect.objectContaining({
        sub: deliveryman.id.toString(),
        role: 'DELIVERYMAN',
      }),
    )
  })

  test('[POST] /sessions - senha errada retorna 401', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '117.569.880-64',
      password: 'senha-errada',
    })

    expect(response.statusCode).toBe(401)
  })
})
