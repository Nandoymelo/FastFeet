import { Module } from '@nestjs/common'

import { JwtEncrypter } from './jwt-encrypter'
import { BcryptHasher } from './bcrypt-hasher'
import { Encrypter } from '@/core/cryptography/encrypter'
import { HashComparer } from '@/core/cryptography/hash-compare'
import { HashGenerator } from '@/core/cryptography/hash-generator'

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher },
  ],
  exports: [Encrypter, HashComparer, HashGenerator],
})
export class CryptographyModule {}
