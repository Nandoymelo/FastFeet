import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/prisma/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { RegisterDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/register-deliveryman'
import { AuthenticateController } from './controllers/authenticate-account.controller'
import { CreateAccountController } from './controllers/create-account-deliveryman.controller'
import { GetDeliverymanController } from './controllers/get-deliveryman.controller'
import { GetDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/get-deliveryman'
import { FetchDeliverymanController } from './controllers/fetch-deliveryman.controller'
import { FetchDeliverymenUseCase } from '@/domain/fastFee/application/use-cases/fetch-deliveryman'
import { DeleteDeliverymanController } from './controllers/delete-deliveryman.controller'
import { DeleteDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/delete-deliveryman'
import { EditDeliverymanUseCase } from '@/domain/fastFee/application/use-cases/edit-deliveryman'
import { EditDeliverymanController } from './controllers/edit-deliveryman.controller'
import { ChangeUserPasswordUseCase } from '@/domain/fastFee/application/use-cases/change-user-password'
import { ChangeUserPasswordController } from './controllers/change-user-password.controller'
import { CreateRecipientController } from './controllers/create-recipient.controller'
import { CreateRecipientUseCase } from '@/domain/fastFee/application/use-cases/create-recipient'
import { GetRecipientController } from './controllers/get-recipient.controller'
import { GetRecipientUseCase } from '@/domain/fastFee/application/use-cases/get-recipient'
import { FetchRecipientController } from './controllers/fetch-recipient.controller'
import { FetchRecipientUseCase } from '@/domain/fastFee/application/use-cases/fetch-recipients'
import { EditRecipientController } from './controllers/edit-recipient.controller'
import { EditRecipientUseCase } from '@/domain/fastFee/application/use-cases/edit-recipient'
import { DeleteRecipientController } from './controllers/delete-recipient.controller'
import { DeleteRecipientUseCase } from '@/domain/fastFee/application/use-cases/delete-recipient'
import { CreateOrderController } from './controllers/create-order.controller'
import { CreateOrderUseCase } from '@/domain/fastFee/application/use-cases/create-order'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AuthenticateController,
    CreateAccountController,
    GetDeliverymanController,
    FetchDeliverymanController,
    DeleteDeliverymanController,
    EditDeliverymanController,
    ChangeUserPasswordController,
    CreateRecipientController,
    GetRecipientController,
    FetchRecipientController,
    EditRecipientController,
    DeleteRecipientController,
    CreateOrderController,
  ],
  providers: [
    RegisterDeliverymanUseCase,
    GetDeliverymanUseCase,
    FetchDeliverymenUseCase,
    DeleteDeliverymanUseCase,
    EditDeliverymanUseCase,
    ChangeUserPasswordUseCase,
    CreateRecipientUseCase,
    GetRecipientUseCase,
    FetchRecipientUseCase,
    EditRecipientUseCase,
    DeleteRecipientUseCase,
    CreateOrderUseCase,
  ],
})
export class HttpModule {}
