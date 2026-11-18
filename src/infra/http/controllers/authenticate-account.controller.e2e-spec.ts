import { execSync } from 'node:child_process'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { envSchema } from '@/infra/env/env'
import { AuthModule } from '@/infra/auth/auth.module'
import { DatabaseModule } from '@/infra/database/prisma/database.module'
import { AuthenticateController } from './authenticate-account.controller'

describe('Authenticate (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService

  beforeAll(async () => {
    // Cria o admin exatamente como o seed.ts faz (se já existir, ele não duplica)
    execSync('npx prisma db seed', { stdio: 'inherit' })

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate: (env) => envSchema.parse(env),
          isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
      ],
      controllers: [AuthenticateController],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
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

  test('[POST] /sessions - senha errada retorna 401', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '117.569.880-64',
      password: 'senha-errada',
    })

    expect(response.statusCode).toBe(401)
  })
})
