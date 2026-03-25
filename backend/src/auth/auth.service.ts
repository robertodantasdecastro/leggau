import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly sessionStoreService: SessionStoreService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const { passwordHash, passwordSalt } = this.hashPassword(dto.password);

    const appUser = await this.appUserRepository.save(
      this.appUserRepository.create({
        email: dto.email.toLowerCase(),
        displayName: dto.displayName ?? dto.email.split('@')[0],
        passwordHash,
        passwordSalt,
        role: 'parent',
      }),
    );

    let parent = await this.parentRepository.findOne({
      where: { email: appUser.email },
    });

    if (!parent) {
      parent = await this.parentRepository.save(
        this.parentRepository.create({
          email: appUser.email,
          name: appUser.displayName,
          role: 'guardian',
        }),
      );
    }

    const session = this.sessionStoreService.createSession(
      'app',
      appUser.id,
      appUser.email,
    );

    return {
      ...session,
      user: this.serializeUser(appUser),
      parent,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !this.verifyPassword(dto.password, user.passwordSalt, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      ...this.sessionStoreService.createSession('app', user.id, user.email),
      user: this.serializeUser(user),
    };
  }

  async refresh(dto: RefreshDto) {
    const session = this.sessionStoreService.getSession(dto.token);
    if (!session || session.scope !== 'app') {
      throw new UnauthorizedException('Invalid session');
    }

    this.sessionStoreService.revokeSession(dto.token);

    return {
      ...this.sessionStoreService.createSession('app', session.subjectId, session.email),
      refreshedFrom: dto.token,
    };
  }

  async logout(dto: LogoutDto) {
    return {
      revoked: this.sessionStoreService.revokeSession(dto.token),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = this.sessionStoreService.issueResetToken(user.id, user.email);

    return {
      sent: true,
      channel: 'email-sandbox',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = this.sessionStoreService.consumeResetToken(dto.token);
    if (!record) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: record.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, passwordSalt } = this.hashPassword(dto.newPassword);
    user.passwordHash = passwordHash;
    user.passwordSalt = passwordSalt;
    await this.appUserRepository.save(user);

    return {
      reset: true,
      user: this.serializeUser(user),
    };
  }

  async devLogin(dto: DevLoginDto) {
    let parent = await this.parentRepository.findOne({
      where: { email: dto.email },
    });

    if (!parent) {
      parent = await this.parentRepository.save(
        this.parentRepository.create({
          email: dto.email,
          name: dto.name ?? dto.email.split('@')[0],
          role: 'guardian',
        }),
      );
    }

    return {
      accessToken: `dev-token-${parent.id}`,
      parent,
    };
  }

  private hashPassword(password: string) {
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');

    return {
      passwordHash,
      passwordSalt,
    };
  }

  private verifyPassword(password: string, salt: string, hash: string) {
    const derived = scryptSync(password, salt, 64);
    const existing = Buffer.from(hash, 'hex');

    return existing.length === derived.length && timingSafeEqual(derived, existing);
  }

  private serializeUser(user: AppUser) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
