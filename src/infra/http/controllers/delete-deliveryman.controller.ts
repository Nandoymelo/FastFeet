import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { DeleteDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/delete-deliveryman'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'

@Controller('/deliveryman/:id')
@UseGuards(JwtAuthGuard)
export class DeleteDeliverymanController {
  constructor(private deleteDeliveryman: DeleteDeliverymanUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.deleteDeliveryman.execute({
      adminId: user.sub,
      deliverymanId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
