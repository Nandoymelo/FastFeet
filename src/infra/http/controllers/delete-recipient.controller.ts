import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { RecipientNotFoundError } from '@/core/errors/recipient-not-found-error'
import { DeleteRecipientUseCase } from '@/domain/fastFee/application/use-cases/delete-recipient'
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

@Controller('/recipient/:id')
@UseGuards(JwtAuthGuard)
export class DeleteRecipientController {
  constructor(private deleteRecipient: DeleteRecipientUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.deleteRecipient.execute({
      adminId: user.sub,
      recipientId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case RecipientNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
