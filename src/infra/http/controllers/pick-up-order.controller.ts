import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '@/core/errors/order-status-transition-error'
import { PickUpOrderUseCase } from '@/domain/fastFee/application/use-cases/pick-up-order'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'

@Controller('/order/:id/pickup')
@UseGuards(JwtAuthGuard)
export class PickUpOrderController {
  constructor(private pickUpOrder: PickUpOrderUseCase) {}

  @Patch()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.pickUpOrder.execute({
      deliverymanId: user.sub,
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case OrderNotFoundError:
          throw new NotFoundException(error.message)
        case OrderStatusTransitionError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
