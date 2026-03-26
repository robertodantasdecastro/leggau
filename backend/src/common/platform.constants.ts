export const APP_ACTOR_ROLES = [
  'parent_guardian',
  'therapist',
  'child',
  'adolescent',
] as const;

export const ADMIN_ACTOR_ROLES = ['admin', 'support_admin'] as const;

export const ACTOR_ROLES = [...APP_ACTOR_ROLES, ...ADMIN_ACTOR_ROLES] as const;

export type ActorRole = (typeof ACTOR_ROLES)[number];

export const AGE_BANDS = ['6-9', '10-12', '13-17'] as const;

export type AgeBand = (typeof AGE_BANDS)[number];

export const LINK_STATUSES = ['pending', 'active', 'revoked', 'suspended'] as const;

export type LinkStatus = (typeof LINK_STATUSES)[number];

export const CONSENT_STATUSES = [
  'draft',
  'published',
  'accepted',
  'revoked',
  'expired',
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const INCIDENT_STATUSES = ['open', 'triaged', 'blocked', 'resolved'] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const SESSION_SCOPES = ['app', 'admin'] as const;

export type SessionScope = (typeof SESSION_SCOPES)[number];

export function resolveAgeBand(age: number): AgeBand {
  if (age >= 13) {
    return '13-17';
  }

  if (age >= 10) {
    return '10-12';
  }

  return '6-9';
}

