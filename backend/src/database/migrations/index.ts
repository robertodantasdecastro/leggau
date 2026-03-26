import { PhaseBCore2026032600010 } from './2026032600010-phase-b-core.migration';
import { SocialAuthAndMedia2026032600020 } from './2026032600020-social-auth-and-media.migration';
import { NormalizeLegacyAudiences2026032600030 } from './2026032600030-normalize-legacy-audiences.migration';
import { InviteOwnership2026032600040 } from './2026032600040-invite-ownership.migration';
import { ProgressMinorCompat2026032600050 } from './2026032600050-progress-minor-compat.migration';

export const DATABASE_MIGRATIONS = [
  PhaseBCore2026032600010,
  SocialAuthAndMedia2026032600020,
  NormalizeLegacyAudiences2026032600030,
  InviteOwnership2026032600040,
  ProgressMinorCompat2026032600050,
];
