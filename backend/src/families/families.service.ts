import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(AdolescentProfile)
    private readonly adolescentRepository: Repository<AdolescentProfile>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
  ) {}

  async getOverview(email?: string) {
    const resolvedEmail =
      email ??
      this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
      'parent@leggau.local';

    const parent = await this.parentRepository.findOne({
      where: { email: resolvedEmail },
    });

    if (!parent) {
      return {
        parent: null,
        children: [],
        guardian: null,
        guardianLinks: [],
        minorProfiles: [],
      };
    }

    const guardianLinks = await this.guardianLinkRepository.find({
      where: {
        parentProfileId: parent.id,
        status: 'active',
      },
      order: { createdAt: 'ASC' },
    });

    const childIds = guardianLinks
      .filter((link) => link.minorRole === 'child')
      .map((link) => link.minorProfileId);
    const adolescentIds = guardianLinks
      .filter((link) => link.minorRole === 'adolescent')
      .map((link) => link.minorProfileId);

    const [childrenProfiles, adolescentProfiles] = await Promise.all([
      childIds.length
        ? this.childRepository.find({
            where: { id: In(childIds) },
          })
        : Promise.resolve([]),
      adolescentIds.length
        ? this.adolescentRepository.find({
            where: { id: In(adolescentIds) },
          })
        : Promise.resolve([]),
    ]);

    const childById = new Map(childrenProfiles.map((profile) => [profile.id, profile]));
    const adolescentById = new Map(
      adolescentProfiles.map((profile) => [profile.id, profile]),
    );

    const minorProfiles = guardianLinks
      .map((link) => {
        const profile =
          link.minorRole === 'adolescent'
            ? adolescentById.get(link.minorProfileId)
            : childById.get(link.minorProfileId);

        if (!profile) {
          return null;
        }

        return {
          id: profile.id,
          name: profile.name,
          age: profile.age,
          ageBand: profile.ageBand,
          avatar: profile.avatar,
          role: link.minorRole,
          guardianLink: link,
        };
      })
      .filter((profile): profile is NonNullable<typeof profile> => profile !== null);

    const children = minorProfiles.map((profile) => ({
      id: profile.id,
      parentId: parent.id,
      name: profile.name,
      age: profile.age,
      ageBand: profile.ageBand,
      avatar: profile.avatar,
      role: profile.role,
    }));

    return {
      parent,
      guardian: parent,
      children,
      guardianLinks,
      minorProfiles,
    };
  }
}
