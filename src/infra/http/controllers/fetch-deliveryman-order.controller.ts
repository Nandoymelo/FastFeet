import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import z from 'zod'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { OrderPresenter } from '../presenters/order-presenter'
import { FetchDeliverymanOrdersUseCase } from '@/domain/fastFee/application/use-cases/fetch-deliveryman-orders'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/order/mine')
@UseGuards(JwtAuthGuard)
export class FetchDeliverymanOrderController {
  constructor(private fetchDeliverymanOrder: FetchDeliverymanOrdersUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
  ) {
    const result = await this.fetchDeliverymanOrder.execute({
      deliverymanId: user.sub,
      page,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { orders } = result.value

    return { orders: orders.map(OrderPresenter.toHTTP) }
  }
}
