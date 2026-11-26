import { StorageProvider } from '@/domain/fastFee/application/storage/storage-provider'
import { Module } from '@nestjs/common'
import { EnvModule } from '../env/env.module'
import { LocalStorageProvider } from './local-storage-provider'

@Module({
  imports: [EnvModule],
  providers: [{ provide: StorageProvider, useClass: LocalStorageProvider }],
  exports: [StorageProvider],
})
export class StorageModule {}
