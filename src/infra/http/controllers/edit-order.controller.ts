import { NotAllowedError } from '@/core/errors/not-allowed-error'
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
import { RecipientNotFoundError } from '@/core/errors/recipient-not-found-error'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { OrderCannotBeEditedError } from '@/core/errors/order-cannot-be-edited-error'
import { EditOrderUseCase } from '@/domain/fastFee/application/use-cases/edit-order'

const editOrderBodySchema = z.object({
  recipientId: z.uuid(),
})

const bodyValidationPipe = new ZodValidationPipe(editOrderBodySchema)

type EditOrderBodySchema = z.infer<typeof editOrderBodySchema>

@Controller('/order/:id')
@UseGuards(JwtAuthGuard)
export class EditOrderController {
  constructor(private editOrder: EditOrderUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditOrderBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    const { recipientId } = body
    const userId = user.sub

    const result = await this.editOrder.execute({
      adminId: userId,
      recipientId,
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case RecipientNotFoundError:
        case OrderNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCannotBeEditedError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
