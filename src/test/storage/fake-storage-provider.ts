import type { StorageProvider } from '@/domain/fastFee/application/storage/storage-provider'

export class FakeStorageProvider implements StorageProvider {
  uploads: {
    fileName: string
    contentType: string
  }[] = []

  async upload(
    file: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    this.uploads.push({ fileName, contentType })

    return `fake-storage/${fileName}`
  }
}
