import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'

const authenticateBodySchema = z.object({
  cpf: z.string().transform(Cpf.normalize),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { cpf, password } = body

    const user = await this.prisma.user.findUnique({
      where: { cpf },
    })

    if (!user) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const isPasswordValid = await compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const accessToken = this.jwt.sign({ sub: user.id, role: user.role })

    return { access_token: accessToken }
  }
}
