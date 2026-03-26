import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { resolveAgeBand } from '../common/platform.constants';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(AdolescentProfile)
    private readonly adolescentRepository: Repository<AdolescentProfile>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(InteractionPolicy)
    private readonly interactionPolicyRepository: Repository<InteractionPolicy>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async create(dto: CreateChildDto) {
    const normalizedEmail = dto.parentEmail?.trim().toLowerCase();
    const parent = await this.parentRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const appUser =
      (parent.appUserId
        ? await this.appUserRepository.findOne({ where: { id: parent.appUserId } })
        : null) ??
      (await this.appUserRepository.findOne({
        where: { email: normalizedEmail },
      }));

    if (!appUser) {
      throw new NotFoundException('Parent app user not found');
    }

    const age = Math.max(1, dto.age ?? 6);
    const ageBand = resolveAgeBand(age);
    const avatar = dto.avatar?.trim() || 'gau-rounded-pixel';
    const minorRole = age >= 13 ? 'adolescent' : 'child';

    const profile =
      minorRole === 'adolescent'
        ? await this.adolescentRepository.save(
            this.adolescentRepository.create({
              name: dto.name?.trim() || 'Explorador Gau',
              age,
              ageBand,
              avatar,
            }),
          )
        : await this.childRepository.save(
            this.childRepository.create({
              parentId: parent.id,
              name: dto.name?.trim() || 'Explorador Gau',
              age,
              ageBand,
              avatar,
            }),
          );

    await this.guardianLinkRepository.save(
      this.guardianLinkRepository.create({
        parentUserId: appUser.id,
        parentProfileId: parent.id,
        minorProfileId: profile.id,
        minorRole,
        status: 'active',
        approvedAt: new Date(),
        createdBy: appUser.id,
        auditContext: {
          source: 'children.create',
          parentEmail: normalizedEmail,
        },
      }),
    );

    await this.interactionPolicyRepository.save(
      this.interactionPolicyRepository.create({
        minorProfileId: profile.id,
        minorRole,
        ageBand,
        roomsEnabled: true,
        presenceEnabled: true,
        messagingMode: 'none',
        therapistParticipationAllowed: false,
        effectiveFrom: new Date(),
      }),
    );

    await this.auditEventRepository.save(
      this.auditEventRepository.create({
        eventType: 'guardianship.create',
        actorRole: 'parent_guardian',
        actorUserId: appUser.id,
        resourceType: 'minor_profile',
        resourceId: profile.id,
        outcome: 'success',
        severity: 'low',
        metadata: {
          parentProfileId: parent.id,
          minorRole,
          age,
          ageBand,
        },
      }),
    );

    return {
      id: profile.id,
      parentId: parent.id,
      name: profile.name,
      age,
      ageBand,
      avatar,
      role: minorRole,
    };
  }
}
