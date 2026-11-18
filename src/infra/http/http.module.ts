import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/prisma/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { RegisterDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/register-deliveryman'
import { AuthenticateController } from './controllers/authenticate-account.controller'
import { CreateAccountController } from './controllers/create-acoount.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [AuthenticateController, CreateAccountController],
  providers: [RegisterDeliverymanUseCase],
})
export class HttpModule {}
