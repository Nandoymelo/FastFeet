export interface StorageProvider {
  upload(file: Buffer, fileName: string, contentType: string): Promise<string>
}
