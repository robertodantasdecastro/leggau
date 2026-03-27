#!/usr/bin/env node

const baseUrl = process.env.LEGGAU_BASE_URL ?? 'http://10.211.55.22:8080/api';
const adminEmail = process.env.LEGGAU_ADMIN_EMAIL ?? 'admin@leggau.local';
const adminPassword = process.env.LEGGAU_ADMIN_PASSWORD ?? 'Admin123!';
const runId = Date.now().toString();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const error = new Error(
      `Request failed ${response.status} ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function expectFailure(path, options = {}, allowedStatuses = [400, 401, 403, 409]) {
  try {
    await request(path, options);
  } catch (error) {
    if (allowedStatuses.includes(error.status)) {
      return error;
    }

    throw error;
  }

  throw new Error(`Expected failure for ${path}`);
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function logStep(label, detail) {
  console.log(`[ok] ${label}: ${detail}`);
}

async function ensureParentConsents(parentEmail) {
  const documents = await request('/legal/documents');
  for (const document of documents) {
    await request('/legal/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: parentEmail,
        documentKey: document.key,
      }),
    });
  }
}

async function main() {
  const adminLogin = await request('/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });
  const adminToken = adminLogin.accessToken;
  assert(adminToken, 'missing admin token');

  const parentEmail = `room-parent.${runId}@leggau.local`;
  const therapistEmail = `room-therapist.${runId}@leggau.local`;

  const parentRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parentEmail,
      password: 'Parent123!',
      displayName: 'Guardia Room',
      role: 'parent_guardian',
    }),
  });
  const therapistRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: therapistEmail,
      password: 'Therapist123!',
      displayName: 'Terapeuta Room',
      role: 'therapist',
    }),
  });

  const parentToken = parentRegister.accessToken;
  const therapistToken = therapistRegister.accessToken;
  assert(parentToken && therapistToken, 'register should issue parent and therapist tokens');

  await ensureParentConsents(parentEmail);

  const minor = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      name: 'Lia Sala',
      age: 8,
      avatar: 'gau-rounded-pixel',
    }),
  });
  assert(minor.id, 'minor profile should be created');

  const family = await request(`/families/overview?email=${encodeURIComponent(parentEmail)}`, {
    headers: authHeaders(parentToken),
  });

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'presence_enabled',
      targetId: minor.id,
      metadata: { source: 'test-room-runtime-invites' },
    }),
  });
  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'therapist_linking',
      targetId: minor.id,
      metadata: { source: 'test-room-runtime-invites' },
    }),
  });
  await request(`/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomsEnabled: true,
      presenceEnabled: true,
      therapistParticipationAllowed: true,
    }),
  });

  const careTeam = await request('/care-team', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      therapistUserId: therapistRegister.user.id,
      parentUserId: family.guardian.appUserId ?? parentRegister.user.id,
      parentProfileId: family.guardian.id,
      minorProfileId: minor.id,
      minorRole: minor.role,
      scope: {
        supervisedPresence: true,
        source: 'test-room-runtime-invites',
      },
    }),
  });

  await request(`/care-team/${careTeam.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      parentApprovalStatus: 'approved',
    }),
  });
  await request(`/care-team/${careTeam.id}/admin`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      adminApprovalStatus: 'approved',
    }),
  });

  const parentRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(parentRooms.allowed === true && parentRooms.items.length > 0, 'parent should have room catalog');
  const room = parentRooms.items[0];

  const therapistBlocked = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistBlocked.allowed === false &&
      therapistBlocked.requirements?.blockedBy?.includes('room_invite_required'),
    'therapist should require explicit room invite',
  );
  logStep('room invite required', therapistBlocked.reason);

  const pendingInvite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'monitored_room',
      targetEmail: therapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: minor.id,
      metadata: {
        parentEmail,
        parentName: 'Guardia Room',
        minorName: minor.name,
        minorRole: minor.role,
        ageBand: minor.ageBand,
        roomId: room.id,
        roomTitle: room.title,
      },
    }),
  });
  assert(pendingInvite.id, 'pending room invite should be created');

  const therapistPending = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistPending.requirements?.roomInviteStatus === 'pending',
    'therapist should see pending invite status before acceptance',
  );
  logStep('room invite pending', 'therapist sees pending runtime invite');

  await request(`/invites/${pendingInvite.id}/accept`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
  });

  const therapistRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(therapistRooms.allowed === true, 'therapist should unlock rooms after invite acceptance');

  await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  await request('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  logStep('room invite accepted', 'therapist entered the monitored room');

  await request(`/invites/${pendingInvite.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      status: 'revoked',
    }),
  });
  const revokedHeartbeat = await expectFailure('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(
    revokedHeartbeat.status === 403,
    'therapist heartbeat should fail after guardian revokes room invite',
  );
  logStep('room invite revoked', 'therapist lost runtime access after guardian revoke');

  const expiredInvite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'monitored_room',
      targetEmail: therapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: minor.id,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      metadata: {
        parentEmail,
        parentName: 'Guardia Room',
        minorName: minor.name,
        minorRole: minor.role,
        ageBand: minor.ageBand,
        roomId: room.id,
        roomTitle: room.title,
      },
    }),
  });
  assert(expiredInvite.id, 'expired room invite should be created');

  const therapistExpired = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistExpired.requirements?.blockedBy?.includes('room_invite_expired'),
    'therapist should see expired room invite gate',
  );
  logStep('room invite expired', therapistExpired.reason);

  const adminInvite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'monitored_room',
      targetEmail: therapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: minor.id,
      metadata: {
        parentEmail,
        parentName: 'Guardia Room',
        minorName: minor.name,
        minorRole: minor.role,
        ageBand: minor.ageBand,
        roomId: room.id,
        roomTitle: room.title,
      },
    }),
  });
  await request(`/invites/${adminInvite.id}/accept`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
  });
  await request(`/admin/invites/${adminInvite.id}`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      status: 'revoked',
    }),
  });
  const adminRevokedRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    adminRevokedRooms.requirements?.blockedBy?.includes('room_invite_revoked'),
    'therapist should see admin-revoked room invite gate',
  );
  logStep('admin emergency revoke', adminRevokedRooms.reason);

  const runtimeEvents = await request(
    `/admin/rooms/events?${new URLSearchParams({
      roomId: room.id,
      minorProfileId: minor.id,
    }).toString()}`,
    {
      headers: authHeaders(adminToken),
    },
  );
  assert(
    runtimeEvents.some((event) => event.eventType === 'room_invite.created') &&
      runtimeEvents.some((event) => event.eventType === 'room_invite.accepted') &&
      runtimeEvents.some((event) => event.eventType === 'room_invite.revoked') &&
      runtimeEvents.some((event) => event.eventType === 'room_invite.expired'),
    'runtime events should expose create, accept, revoke and expire transitions',
  );
  logStep('runtime timeline', `${runtimeEvents.length} evento(s) operacionais publicados`);

  console.log('[ok] room runtime invites validated');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
