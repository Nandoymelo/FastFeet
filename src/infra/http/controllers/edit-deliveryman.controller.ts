import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { EditDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/edit-deliveryman'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { Cpf } from '@/domain/fastFee/enterprise/entities/value-object/cpf'
import { UserAlreadyExistsError } from '@/core/errors/user-already-exists-error'

const editDeliverymanBodySchema = z.object({
  name: z.string(),
  cpf: z.string().refine(Cpf.isValid, 'Invalid CPF.').transform(Cpf.normalize),
})

const bodyValidationPipe = new ZodValidationPipe(editDeliverymanBodySchema)

type EditDeliverymanBodySchema = z.infer<typeof editDeliverymanBodySchema>

@Controller('/deliveryman/:id')
@UseGuards(JwtAuthGuard)
export class EditDeliverymanController {
  constructor(private editDeliveryman: EditDeliverymanUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditDeliverymanBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    const { cpf, name } = body
    const userId = user.sub

    const result = await this.editDeliveryman.execute({
      adminId: userId,
      deliverymanId: id,
      name,
      cpf,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
