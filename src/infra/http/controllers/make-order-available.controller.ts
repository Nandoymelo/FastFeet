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
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { MakeOrderAvailableUseCase } from '@/domain/fastFee/application/use-cases/make-order-available'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '@/core/errors/order-status-transition-error'

@Controller('/order/:id/available')
@UseGuards(JwtAuthGuard)
export class MakeOrderAvailableController {
  constructor(private makeOrderAvailable: MakeOrderAvailableUseCase) {}

  @Patch()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.makeOrderAvailable.execute({
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
        case OrderStatusTransitionError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
