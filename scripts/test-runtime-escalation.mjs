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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const parentEmail = `runtime-parent.${runId}@leggau.local`;
  const therapistEmail = `runtime-therapist.${runId}@leggau.local`;

  const parentRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parentEmail,
      password: 'Parent123!',
      displayName: 'Guardia Runtime',
      role: 'parent_guardian',
    }),
  });
  const therapistRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: therapistEmail,
      password: 'Therapist123!',
      displayName: 'Terapeuta Runtime',
      role: 'therapist',
    }),
  });

  const parentToken = parentRegister.accessToken;
  const therapistToken = therapistRegister.accessToken;
  assert(parentToken && therapistToken, 'parent and therapist tokens should exist');

  await ensureParentConsents(parentEmail);

  const minor = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      name: 'Lia Runtime',
      age: 8,
      avatar: 'gau-rounded-pixel',
    }),
  });
  assert(minor.id, 'minor profile should exist');

  const family = await request(`/families/overview?email=${encodeURIComponent(parentEmail)}`, {
    headers: authHeaders(parentToken),
  });

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'presence_enabled',
      targetId: minor.id,
      metadata: { source: 'test-runtime-escalation' },
    }),
  });
  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'therapist_linking',
      targetId: minor.id,
      metadata: { source: 'test-runtime-escalation' },
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
        source: 'test-runtime-escalation',
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
  const room = parentRooms.items[0];
  assert(room?.id, 'room should exist');

  const invite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'monitored_room',
      targetEmail: therapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: minor.id,
      metadata: {
        parentEmail,
        parentName: 'Guardia Runtime',
        minorName: minor.name,
        minorRole: minor.role,
        ageBand: minor.ageBand,
        roomId: room.id,
        roomTitle: room.title,
      },
    }),
  });
  await request(`/invites/${invite.id}/accept`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
  });

  await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  await request('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
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
  logStep('runtime seeded', 'responsavel e terapeuta entraram na sala');

  const snapshot = await request(
    `/admin/rooms/${encodeURIComponent(room.id)}/snapshot?minorProfileId=${encodeURIComponent(minor.id)}`,
    {
      headers: authHeaders(adminToken),
    },
  );
  assert(snapshot.participantCount >= 2, 'snapshot should include live participants');
  const therapistParticipant = snapshot.participants.find((participant) => participant.actorRole === 'therapist');
  assert(therapistParticipant?.actorUserId, 'snapshot should expose therapist actor user id');
  logStep('runtime snapshot', `${snapshot.participantCount} participante(s) no snapshot`);

  const incident = await request('/incidents', {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      severity: 'high',
      sourceType: 'runtime_snapshot',
      sourceId: `${room.id}:${minor.id}`,
      summary: 'Escalonamento operacional a partir do runtime monitorado',
      runtimeContext: {
        roomId: room.id,
        minorProfileId: minor.id,
        minorRole: minor.role,
        actorUserId: therapistParticipant.actorUserId,
        actorRole: 'therapist',
        activeInviteId: invite.id,
        presenceSnapshot: {
          participantCount: snapshot.participantCount,
          lastHeartbeatAt: snapshot.lastHeartbeatAt,
        },
      },
    }),
  });
  assert(
    incident.metadata?.runtimeContext?.roomId === room.id,
    'incident should persist runtimeContext',
  );

  const moderationCase = await request('/moderation/cases', {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      severity: 'high',
      sourceType: 'runtime_snapshot',
      sourceId: `${room.id}:${minor.id}`,
      policyCode: 'runtime-escalation-review',
      humanReviewRequired: true,
      aiDecision: {
        disposition: 'hold',
      },
      runtimeContext: {
        roomId: room.id,
        minorProfileId: minor.id,
        minorRole: minor.role,
        actorUserId: therapistParticipant.actorUserId,
        actorRole: 'therapist',
        eventId: snapshot.activeInviteId,
      },
    }),
  });
  assert(
    moderationCase.aiDecision?.runtimeContext?.roomId === room.id,
    'moderation case should persist runtimeContext',
  );
  logStep('runtime context persistence', 'incident e moderacao carregaram contexto operacional');

  await request(`/admin/rooms/${room.id}/participants/remove`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      actorRole: 'therapist',
      actorUserId: therapistParticipant.actorUserId,
      lockMinutes: 0.01,
      message: 'Participacao terapeutica encerrada temporariamente pela operacao.',
    }),
  });

  const blockedTherapistJoin = await expectFailure(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(blockedTherapistJoin.status === 403, 'therapist join should be blocked after removal');

  const blockedTherapistHeartbeat = await expectFailure('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(blockedTherapistHeartbeat.status === 403, 'therapist heartbeat should be blocked after removal');

  await request('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  logStep('participant removal', 'terapeuta bloqueado e responsavel preservado');

  await sleep(800);
  const therapistRestoredRooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(therapistToken),
  });
  assert(therapistRestoredRooms.allowed === true, 'therapist should recover after lock expiry');
  await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  logStep('lock expiry', 'lock do participante expirou e o runtime voltou a obedecer gates normais');

  await request(`/admin/rooms/${room.id}/terminate`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      lockMinutes: 0.01,
      message: 'Sala pausada pela operacao para revisao humana.',
    }),
  });

  const blockedParentJoin = await expectFailure(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(blockedParentJoin.status === 403, 'parent join should be blocked after room termination');

  const blockedParentHeartbeat = await expectFailure('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(blockedParentHeartbeat.status === 403, 'parent heartbeat should be blocked after room termination');
  logStep('room termination', 'sala pausada operacionalmente com bloqueio temporario');

  const terminatedSnapshot = await request(
    `/admin/rooms/${encodeURIComponent(room.id)}/snapshot?minorProfileId=${encodeURIComponent(minor.id)}`,
    {
      headers: authHeaders(adminToken),
    },
  );
  assert(
    terminatedSnapshot.operationalStatus === 'room_closed_admin' &&
      terminatedSnapshot.participantCount === 0,
    'terminated snapshot should expose room lock and zero active participants',
  );

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
    runtimeEvents.some((event) => event.eventType === 'admin.runtime_participant_removed') &&
      runtimeEvents.some((event) => event.eventType === 'admin.room_terminated') &&
      runtimeEvents.some((event) => event.eventType === 'room.join_blocked_admin_lock') &&
      runtimeEvents.some((event) => event.eventType === 'presence.heartbeat_blocked_admin_lock'),
    'runtime events should expose admin escalation and lock blocks',
  );

  await sleep(800);
  const parentRoomsRecovered = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(parentRoomsRecovered.allowed === true, 'parent should recover after room lock expiry');
  await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  logStep('room lock expiry', 'sala voltou a obedecer somente invite/policy/gates normais');

  console.log('[ok] runtime escalation validated');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
