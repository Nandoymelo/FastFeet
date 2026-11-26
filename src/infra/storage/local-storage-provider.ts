import { StorageProvider } from '@/domain/fastFee/application/storage/storage-provider'
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { EnvService } from '../env/env.service'

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private env: EnvService) {}

  async upload(
    file: Buffer,
    _fileName: string,
    contentType: string,
  ): Promise<string> {
    const uploadDir = this.env.get('UPLOAD_DIR')

    await mkdir(resolve(uploadDir), { recursive: true })

    // O nome enviado pelo cliente nunca é usado no disco: evita path traversal
    // e sobrescrita de arquivos.
    const storedName = `${randomUUID()}${EXTENSIONS[contentType] ?? ''}`

    await writeFile(resolve(uploadDir, storedName), file, { flag: 'wx' })

    return join(uploadDir, storedName)
  }
}
