import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../common/entities/admin-user.entity';
import { SessionStoreService } from '../common/session-store.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly sessionStoreService: SessionStoreService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (
      !admin ||
      !admin.isActive ||
      !this.verifyPassword(dto.password, admin.passwordSalt, admin.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const session = await this.sessionStoreService.createSession(
      'admin',
      admin.id,
      admin.email,
      admin.role,
      7200,
    );

    return {
      ...session,
      admin: this.serializeAdmin(admin),
    };
  }

  async listAdmins() {
    const admins = await this.adminUserRepository.find({
      order: { createdAt: 'ASC' },
    });

    return admins.map((admin) => this.serializeAdmin(admin));
  }

  async createAdmin(dto: CreateAdminUserDto) {
    const existing = await this.adminUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Admin already exists');
    }

    const { passwordHash, passwordSalt } = this.hashPassword(dto.password);
    const admin = await this.adminUserRepository.save(
      this.adminUserRepository.create({
        email: dto.email.toLowerCase(),
        displayName: dto.displayName ?? dto.email.split('@')[0],
        role: dto.role ?? 'support_admin',
        passwordHash,
        passwordSalt,
      }),
    );

    return this.serializeAdmin(admin);
  }

  async updateAdmin(id: string, dto: UpdateAdminUserDto) {
    const admin = await this.adminUserRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    admin.displayName = dto.displayName ?? admin.displayName;
    admin.role = dto.role ?? admin.role;
    admin.isActive = dto.isActive ?? admin.isActive;
    await this.adminUserRepository.save(admin);

    return this.serializeAdmin(admin);
  }

  async getAdminSession(token?: string) {
    const session = await this.sessionStoreService.getSession(token, 'admin');
    if (!session || session.scope !== 'admin') {
      return null;
    }

    return session;
  }

  private hashPassword(password: string) {
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');
    return { passwordHash, passwordSalt };
  }

  private verifyPassword(password: string, salt: string, hash: string) {
    const derived = scryptSync(password, salt, 64);
    const existing = Buffer.from(hash, 'hex');
    return existing.length === derived.length && timingSafeEqual(derived, existing);
  }

  private serializeAdmin(admin: AdminUser) {
    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }
}
