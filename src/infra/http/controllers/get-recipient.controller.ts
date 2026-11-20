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
import { GetRecipientUseCase } from '@/domain/fastFee/application/use-cases/get-recipient'
import { RecipientNotFoundError } from '@/core/errors/recipient-not-found-error'
import { RecipientPresenter } from '../presenters/recipient-presenter'

@Controller('/recipient/:id')
@UseGuards(JwtAuthGuard)
export class GetRecipientController {
  constructor(private getRecipient: GetRecipientUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const result = await this.getRecipient.execute({
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

    const { recipient } = result.value

    return { recipient: RecipientPresenter.toHTTP(recipient) }
  }
}
