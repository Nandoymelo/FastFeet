import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/prisma/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { RegisterDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/register-deliveryman'
import { AuthenticateController } from './controllers/authenticate-account.controller'
import { CreateAccountController } from './controllers/create-account-deliverymen.controller'
import { GetDeliverymanController } from './controllers/get-deliveryman.controller'
import { GetDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/get-deliveryman'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AuthenticateController,
    CreateAccountController,
    GetDeliverymanController,
  ],
  providers: [RegisterDeliverymanUseCase, GetDeliverymanUseCase],
})
export class HttpModule {}
