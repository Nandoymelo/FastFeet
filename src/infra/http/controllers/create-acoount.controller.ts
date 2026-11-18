import { RegisterDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/register-deliveryman'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { UserAlreadyExistsError } from '@/core/errors/user-already-exists-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'

const createAccountBodySchema = z.object({
  name: z.string().min(3),
  cpf: z.string().refine(Cpf.isValid, 'Invalid CPF.').transform(Cpf.normalize),
  password: z.string().min(6),
})

const bodyValidationPipe = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class CreateAccountController {
  constructor(private registerDeliverymanUsecase: RegisterDeliverymanUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: CreateAccountBodySchema,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create accounts.')
    }

    const { name, cpf, password } = body
    const userId = user.sub

    const result = await this.registerDeliverymanUsecase.execute({
      adminId: userId,
      name,
      cpf,
      password,
    })
    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
