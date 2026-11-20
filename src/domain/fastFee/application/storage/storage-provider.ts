export abstract class StorageProvider {
  abstract upload(
    file: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string>
}
