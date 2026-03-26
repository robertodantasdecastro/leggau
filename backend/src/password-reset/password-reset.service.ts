import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AppUser } from '../common/entities/app-user.entity';
import { SessionStoreService } from '../common/session-store.service';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly auditService: AuditService,
    private readonly sessionStoreService: SessionStoreService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
  ) {}

  async requestReset(dto: PasswordResetRequestDto) {
    const user = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = await this.sessionStoreService.issueResetToken(user.id, user.email);

    await this.auditService.record('auth.password_reset_requested', {
      actorRole: user.role,
      actorUserId: user.id,
      resourceType: 'app_user',
      resourceId: user.id,
      outcome: 'success',
      severity: 'low',
    });

    return {
      sent: true,
      channel: 'email-sandbox',
      resetToken,
    };
  }

  async confirmReset(dto: PasswordResetConfirmDto) {
    const record = await this.sessionStoreService.consumeResetToken(dto.token);
    if (!record) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: record.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(dto.newPassword, passwordSalt, 64).toString('hex');
    user.passwordSalt = passwordSalt;
    user.passwordHash = passwordHash;
    await this.appUserRepository.save(user);

    await this.auditService.record('auth.password_reset_completed', {
      actorRole: user.role,
      actorUserId: user.id,
      resourceType: 'app_user',
      resourceId: user.id,
      outcome: 'success',
      severity: 'low',
    });

    return {
      reset: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
