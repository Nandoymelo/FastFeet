import { Encrypter } from '@/core/cryptography/encrypter'
import { AuthenticateUseCase } from '@/domain/fastFee/application/use-cases/authenticate-user'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const authenticateBodySchema = z.object({
  cpf: z.string().transform(Cpf.normalize),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private authenticate: AuthenticateUseCase,
    private encrypter: Encrypter,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { cpf, password } = body

    const result = await this.authenticate.execute({ cpf, password })

    if (result.isLeft()) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const { user } = result.value

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
      role: user.role,
    })

    return { access_token: accessToken }
  }
}
