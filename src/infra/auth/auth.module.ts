import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from '../env/env'
import { JwtStrategy } from './jwt.strategy'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [
    PassportModule,
    EnvModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory(config: ConfigService<Env, true>) {
        const privateKey = config.get('JWT_PRIVATE_KEY', { infer: true })
        const publicKey = config.get('JWT_PUBLIC_KEY', { infer: true })

        return {
          signOptions: { algorithm: 'RS256' },
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
        }
      },
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
