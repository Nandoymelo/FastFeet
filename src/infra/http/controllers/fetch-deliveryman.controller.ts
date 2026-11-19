import { FetchDeliverymenUseCase } from '@/domain/fastFee/application/use-cases/fetch-deliveryman'
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { DeliverymanPresenter } from '../presenters/deliveryman-presenter'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import z from 'zod'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/deliveryman')
@UseGuards(JwtAuthGuard)
export class FetchDeliverymanController {
  constructor(private fetchDeliveryman: FetchDeliverymenUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
  ) {
    const result = await this.fetchDeliveryman.execute({
      adminId: user.sub,
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

    const { users } = result.value

    return { deliverymen: users.map(DeliverymanPresenter.toHTTP) }
  }
}
