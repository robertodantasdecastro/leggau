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

  logStep('consentimentos', `${documents.length} policies aceitas para ${parentEmail}`);
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
  assert(adminToken, 'admin token missing');
  logStep('admin login', 'token emitido');

  const parentEmail = `guardian.${runId}@leggau.local`;
  const therapistEmail = `therapist.${runId}@leggau.local`;
  const outsiderEmail = `outsider.${runId}@leggau.local`;

  const parentRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parentEmail,
      password: 'Parent123!',
      displayName: 'Guardia Demo',
      role: 'parent_guardian',
    }),
  });
  const therapistRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: therapistEmail,
      password: 'Therapist123!',
      displayName: 'Terapeuta Demo',
      role: 'therapist',
    }),
  });
  const outsiderRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: outsiderEmail,
      password: 'Other123!',
      displayName: 'Outro Responsavel',
      role: 'parent_guardian',
    }),
  });

  const parentToken = parentRegister.accessToken;
  const therapistToken = therapistRegister.accessToken;
  const outsiderToken = outsiderRegister.accessToken;
  assert(parentToken && therapistToken && outsiderToken, 'register should return access tokens');
  logStep('auth multiactor', 'parent, therapist e outsider provisionados');

  await ensureParentConsents(parentEmail);

  const minor = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      name: 'Lia Monitorada',
      age: 8,
      avatar: 'gau-rounded-pixel',
    }),
  });
  assert(minor.role === 'child', 'expected child profile');
  logStep('minor provisioning', `${minor.name} criada com role ${minor.role}`);

  const family = await request(`/families/overview?email=${encodeURIComponent(parentEmail)}`, {
    headers: authHeaders(parentToken),
  });
  const selectedMinor = (family.minorProfiles ?? []).find((item) => item.id === minor.id);
  assert(selectedMinor, 'family overview should expose created minor');

  const parentPolicy = await request(`/interaction-policies/${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(parentPolicy.minorProfileId === minor.id, 'parent should read minor interaction policy');
  logStep('guardian policy read', 'responsavel leu a policy do menor');

  const blockedRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(blockedRooms.allowed === false, 'rooms should be blocked without presence_enabled');
  assert(
    blockedRooms.requirements?.blockedBy?.includes('presence_enabled_required'),
    'rooms should explain missing presence_enabled gate',
  );
  logStep('presence gate hard block', blockedRooms.reason);

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'presence_enabled',
      targetId: minor.id,
      metadata: { source: 'test-monitored-supervision' },
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

  const allowedRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(allowedRooms.allowed === true && allowedRooms.items.length > 0, 'rooms should unlock after presence approval');
  const room = allowedRooms.items[0];
  logStep('presence gate release', `${room.title} publicada para o responsavel`);

  const parentJoin = await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(parentJoin.activeRoomId === room.id, 'parent join should activate room');
  await request('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  logStep('guardian runtime', 'responsavel entrou e enviou heartbeat');

  const therapistMembership = await request('/care-team', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      therapistUserId: therapistRegister.user.id,
      parentUserId: family.guardian.appUserId ?? parentRegister.user.id ?? family.guardian.appUserId,
      parentProfileId: family.guardian.id,
      minorProfileId: minor.id,
      minorRole: minor.role,
      scope: {
        supervisedPresence: true,
        source: 'test-monitored-supervision',
      },
    }),
  });
  assert(therapistMembership.id, 'care-team membership should be created');

  const therapistBlockedPending = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(therapistBlockedPending.allowed === false, 'therapist should stay blocked before approvals');
  assert(
    therapistBlockedPending.requirements?.blockedBy?.includes('care_team_parent_approval_required') &&
      therapistBlockedPending.requirements?.blockedBy?.includes('care_team_admin_approval_required'),
    'therapist should expose missing approval dependencies',
  );
  logStep('therapist blocked pending approvals', therapistBlockedPending.reason);

  await request(`/care-team/${therapistMembership.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      parentApprovalStatus: 'approved',
    }),
  });
  const therapistBlockedAdmin = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistBlockedAdmin.requirements?.blockedBy?.includes('care_team_admin_approval_required'),
    'therapist should still wait for admin approval',
  );
  logStep('therapist blocked by admin gate', therapistBlockedAdmin.reason);

  await request(`/care-team/${therapistMembership.id}/admin`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      adminApprovalStatus: 'approved',
    }),
  });

  const therapistBlockedLinking = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistBlockedLinking.requirements?.blockedBy?.includes('therapist_linking_required'),
    'therapist should still wait for therapist_linking approval',
  );
  logStep('therapist blocked by therapist_linking', therapistBlockedLinking.reason);

  const therapistPolicyWriteFailure = await expectFailure(`/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      therapistParticipationAllowed: false,
    }),
  });
  assert(therapistPolicyWriteFailure.status === 403, 'therapist policy edit should be forbidden');

  const outsiderPolicyWriteFailure = await expectFailure(`/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(outsiderToken),
    body: JSON.stringify({
      roomsEnabled: false,
    }),
  });
  assert(outsiderPolicyWriteFailure.status === 403, 'unlinked guardian policy edit should be forbidden');
  logStep('policy authorization', 'therapist e responsavel sem vinculo foram bloqueados na escrita');

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'therapist_linking',
      targetId: minor.id,
      metadata: { source: 'test-monitored-supervision' },
    }),
  });

  const therapistPolicy = await request(`/interaction-policies/${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(therapistPolicy.minorProfileId === minor.id, 'therapist should read policy after gates');

  const therapistAwaitingInvite = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistAwaitingInvite.allowed === false &&
      therapistAwaitingInvite.requirements?.blockedBy?.includes('room_invite_required'),
    'therapist should still need an explicit monitored room invite',
  );

  const roomInvite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'monitored_room',
      targetEmail: therapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: minor.id,
      metadata: {
        parentEmail,
        parentName: 'Guardia Demo',
        minorName: minor.name,
        minorRole: minor.role,
        ageBand: minor.ageBand,
        roomId: room.id,
        roomTitle: room.title,
      },
    }),
  });
  assert(roomInvite.id, 'room invite should be created');

  const therapistPendingInvite = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistPendingInvite.requirements?.roomInviteStatus === 'pending',
    'therapist should see pending invite status before accepting',
  );

  await request(`/invites/${roomInvite.id}/accept`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
  });

  const therapistRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistRooms.allowed === true && therapistRooms.items.length > 0,
    'therapist should access monitored rooms after gates and invite acceptance',
  );

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
  const therapistPresence = await request(`/presence/${room.id}?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(therapistPresence.participantCount >= 1, 'therapist should observe monitored presence');
  logStep('therapist runtime released', `${therapistPresence.participantCount} participante(s) no runtime`);

  const adminPolicy = await request(`/admin/interaction-policies/${minor.id}`, {
    headers: authHeaders(adminToken),
  });
  assert(adminPolicy.minorProfileId === minor.id, 'admin should read policy');

  await request(`/admin/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      presenceEnabled: false,
      therapistParticipationAllowed: true,
      roomsEnabled: true,
    }),
  });
  const parentBlockedByPolicy = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(
    parentBlockedByPolicy.allowed === false &&
      parentBlockedByPolicy.requirements?.blockedBy?.includes('presence_disabled'),
    'admin override should be able to block runtime through policy',
  );

  await request(`/admin/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      presenceEnabled: true,
      therapistParticipationAllowed: true,
      roomsEnabled: true,
    }),
  });
  const parentRestored = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(parentRestored.allowed === true, 'runtime should recover after admin override restore');
  logStep('admin override', 'policy admin bloqueou e restaurou o runtime');

  const adminPresenceAll = await request('/admin/rooms/presence', {
    headers: authHeaders(adminToken),
  });
  assert(adminPresenceAll.length >= 2, 'admin presence view should list live runtime records');

  const adminPresenceTherapist = await request(
    `/admin/rooms/presence?${new URLSearchParams({
      actorRole: 'therapist',
      roomId: room.id,
    }).toString()}`,
    {
      headers: authHeaders(adminToken),
    },
  );
  assert(
    adminPresenceTherapist.some((row) => row.minorProfileId === minor.id && row.actorRole === 'therapist'),
    'admin filtered presence should expose therapist runtime row',
  );
  logStep('admin runtime view', `${adminPresenceAll.length} linha(s) de presenca listadas`);

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
      runtimeEvents.some((event) => event.eventType === 'room_invite.accepted'),
    'admin runtime events should include room invite create/accept entries',
  );
  logStep('admin runtime timeline', `${runtimeEvents.length} evento(s) rastreados`);

  await request(`/rooms/${room.id}/leave`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  await request(`/rooms/${room.id}/leave`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });

  console.log('[ok] monitored supervision validated');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
