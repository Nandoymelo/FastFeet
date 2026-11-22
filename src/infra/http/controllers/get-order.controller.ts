import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { GetOrderUseCase } from '@/domain/fastFee/application/use-cases/get-order'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { OrderPresenter } from '../presenters/order-presenter'

@Controller('/order/:id')
@UseGuards(JwtAuthGuard)
export class GetOrderController {
  constructor(private getOrder: GetOrderUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.getOrder.execute({
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
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { order } = result.value

    return { order: OrderPresenter.toHTTP(order) }
  }
}
