import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import type { EnvService } from '../env/env.service'
import { LocalStorageProvider } from './local-storage-provider'

describe('LocalStorageProvider', () => {
  let uploadDir: string
  let sut: LocalStorageProvider

  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'fastfeet-uploads-'))
    sut = new LocalStorageProvider({
      get: () => uploadDir,
    } as unknown as EnvService)
  })

  afterEach(async () => {
    await rm(uploadDir, { recursive: true, force: true })
  })

  it('should save the file content and return its path', async () => {
    const path = await sut.upload(
      Buffer.from('content'),
      'photo.jpg',
      'image/jpeg',
    )

    expect(path.endsWith('.jpg')).toBe(true)
    expect(await readFile(path, 'utf-8')).toBe('content')
  })

  it('should not use the file name sent by the client', async () => {
    const path = await sut.upload(
      Buffer.from('content'),
      '../../etc/passwd',
      'image/png',
    )

    expect(path).toBe(join(uploadDir, basename(path)))
    expect(basename(path)).not.toContain('passwd')
    expect(path.endsWith('.png')).toBe(true)
  })

  it('should not overwrite files with the same name', async () => {
    const first = await sut.upload(Buffer.from('1'), 'a.jpg', 'image/jpeg')
    const second = await sut.upload(Buffer.from('2'), 'a.jpg', 'image/jpeg')

    expect(first).not.toBe(second)
  })
})
