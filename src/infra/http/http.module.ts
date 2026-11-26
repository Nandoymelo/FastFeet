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
import { GetOrderController } from './controllers/get-order.controller'
import { GetOrderUseCase } from '@/domain/fastFee/application/use-cases/get-order'
import { FetchOrderController } from './controllers/fetch-order.controller'
import { FetchOrdersUseCase } from '@/domain/fastFee/application/use-cases/fetch-orders'
import { DeleteOrderController } from './controllers/delete-order.controller'
import { DeleteOrderUseCase } from '@/domain/fastFee/application/use-cases/delete-order'
import { EditOrderController } from './controllers/edit-order.controller'
import { EditOrderUseCase } from '@/domain/fastFee/application/use-cases/edit-order'
import { FetchDeliverymanOrderController } from './controllers/fetch-deliveryman-order.controller'
import { FetchDeliverymanOrdersUseCase } from '@/domain/fastFee/application/use-cases/fetch-deliveryman-orders'
import { FetchNearbyOrdersController } from './controllers/fetch-nearby-order.controller'
import { FetchNearbyOrdersUseCase } from '@/domain/fastFee/application/use-cases/fetch-nearby-orders'
import { MakeOrderAvailableController } from './controllers/make-order-available.controller'
import { MakeOrderAvailableUseCase } from '@/domain/fastFee/application/use-cases/make-order-available'
import { ReturnOrderController } from './controllers/return-order.controller'
import { ReturnOrderUseCase } from '@/domain/fastFee/application/use-cases/return-order'
import { DeliverOrderController } from './controllers/deliver-order.controller'
import { DeliverOrderUseCase } from '@/domain/fastFee/application/use-cases/deliver-order'
import { StorageModule } from '../storage/storage.module'
import { PickUpOrderController } from './controllers/pick-up-order.controller'
import { PickUpOrderUseCase } from '@/domain/fastFee/application/use-cases/pick-up-order'
import { AuthenticateUseCase } from '@/domain/fastFee/application/use-cases/authenticate-user'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
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
    FetchDeliverymanOrderController,
    FetchNearbyOrdersController,
    GetOrderController,
    FetchOrderController,
    DeleteOrderController,
    EditOrderController,
    MakeOrderAvailableController,
    PickUpOrderController,
    ReturnOrderController,
    DeliverOrderController,
  ],
  providers: [
    AuthenticateUseCase,
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
    GetOrderUseCase,
    FetchOrdersUseCase,
    DeleteOrderUseCase,
    EditOrderUseCase,
    FetchDeliverymanOrdersUseCase,
    FetchNearbyOrdersUseCase,
    MakeOrderAvailableUseCase,
    PickUpOrderUseCase,
    ReturnOrderUseCase,
    DeliverOrderUseCase,
  ],
})
export class HttpModule {}
