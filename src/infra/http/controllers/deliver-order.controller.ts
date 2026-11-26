import { DeliveryPhotoRequiredError } from '@/core/errors/delivery-photo-required-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { OrderNotFoundError } from '@/core/errors/order-not-found-error'
import { OrderStatusTransitionError } from '@/core/errors/order-status-transition-error'
import { DeliverOrderUseCase } from '@/domain/fastFee/application/use-cases/deliver-order'
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
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

const MAX_PHOTO_SIZE_IN_BYTES = 5 * 1024 * 1024 // 5 MB

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff])

interface UploadedPhoto {
  buffer: Buffer
  originalname: string
}

// O tipo é lido dos primeiros bytes do arquivo, porque o mimetype enviado pelo
// cliente pode ser forjado.
function detectImageType(buffer: Buffer) {
  if (buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
    return 'image/jpeg'
  }

  if (buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return 'image/png'
  }

  return null
}

@Controller('/order/:id/deliver')
@UseGuards(JwtAuthGuard)
export class DeliverOrderController {
  constructor(private deliverOrder: DeliverOrderUseCase) {}

  @Patch()
  @HttpCode(204)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_PHOTO_SIZE_IN_BYTES, files: 1 },
    }),
  )
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @UploadedFile() file?: UploadedPhoto,
  ) {
    const contentType = file?.buffer.length
      ? detectImageType(file.buffer)
      : null

    if (file?.buffer.length && !contentType) {
      throw new UnsupportedMediaTypeException(
        'Delivery photo must be a JPEG or PNG image.',
      )
    }

    // Sem arquivo, o buffer vai vazio e o use case devolve
    // DeliveryPhotoRequiredError.
    const result = await this.deliverOrder.execute({
      deliverymanId: user.sub,
      orderId: id,
      photo: {
        buffer: file?.buffer ?? Buffer.alloc(0),
        fileName: file?.originalname ?? '',
        contentType: contentType ?? '',
      },
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
        case DeliveryPhotoRequiredError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
