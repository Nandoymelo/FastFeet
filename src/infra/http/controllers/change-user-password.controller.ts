import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { ChangeUserPasswordUseCase } from '@/domain/fastFee/application/use-cases/change-user-password'
import { UserNotFoundError } from '@/core/errors/user-not-found-error'

const changePasswordDeliverymanBodySchema = z.object({
  password: z.string().min(6),
})

const bodyValidationPipe = new ZodValidationPipe(
  changePasswordDeliverymanBodySchema,
)

type ChangePasswordDeliverymanBodySchema = z.infer<
  typeof changePasswordDeliverymanBodySchema
>

@Controller('/deliveryman/:id/password')
@UseGuards(JwtAuthGuard)
export class ChangeUserPasswordController {
  constructor(private changeUserPassword: ChangeUserPasswordUseCase) {}

  @Patch()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: ChangePasswordDeliverymanBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    const { password } = body
    const userId = user.sub

    const result = await this.changeUserPassword.execute({
      adminId: userId,
      userId: id,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case UserNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
