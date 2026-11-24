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
import { FetchNearbyOrdersUseCase } from '@/domain/fastFee/application/use-cases/fetch-nearby-orders'

const coordinate = (min: number, max: number) =>
  z.string().min(1).transform(Number).pipe(z.number().min(min).max(max))

const fetchNearbyQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
})

const queryValidationPipe = new ZodValidationPipe(fetchNearbyQuerySchema)

type FetchNearbyQuerySchema = z.infer<typeof fetchNearbyQuerySchema>

@Controller('/order/nearby')
@UseGuards(JwtAuthGuard)
export class FetchNearbyOrdersController {
  constructor(private fetchNearbyOrders: FetchNearbyOrdersUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Query(queryValidationPipe) query: FetchNearbyQuerySchema,
  ) {
    const { page, latitude, longitude } = query

    const result = await this.fetchNearbyOrders.execute({
      deliverymanId: user.sub,
      page,
      deliverymanLatitude: latitude,
      deliverymanLongitude: longitude,
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
