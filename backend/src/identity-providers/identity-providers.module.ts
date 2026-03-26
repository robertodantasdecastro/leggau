import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { AuthProviderConfig } from '../common/entities/auth-provider-config.entity';
import { ExternalIdentity } from '../common/entities/external-identity.entity';
import { IdentityProvidersService } from './identity-providers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthProviderConfig, ExternalIdentity, AuditEvent]),
  ],
  providers: [IdentityProvidersService],
  exports: [IdentityProvidersService],
})
export class IdentityProvidersModule {}
