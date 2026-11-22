import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { OrderCannotBeDeletedError } from '@/core/errors/order-cannot-delete-error'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { DeleteOrderUseCase } from '@/domain/fastFee/application/use-cases/delete-order'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'

@Controller('/order/:id')
@UseGuards(JwtAuthGuard)
export class DeleteOrderController {
  constructor(private deleteOrder: DeleteOrderUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.deleteOrder.execute({
      adminId: user.sub,
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case OrderNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCannotBeDeletedError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
