#!/usr/bin/env node

const baseUrl = process.env.LEGGAU_BASE_URL ?? 'http://10.211.55.22:8080/api';
const parentEmail = process.env.LEGGAU_PARENT_EMAIL ?? 'parent@leggau.local';
const parentName = process.env.LEGGAU_PARENT_NAME ?? 'Responsavel Demo';

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

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function ensureConsents() {
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

async function ensureMinor(role, token) {
  const family = await request(`/families/overview?email=${encodeURIComponent(parentEmail)}`, {
    headers: authHeaders(token),
  });
  const existing = (family.minorProfiles ?? []).find((minor) => minor.role === role);
  if (existing) {
    return existing;
  }

  await ensureConsents();
  await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      name: role === 'adolescent' ? 'Gau Teen' : 'Gau Child',
      age: role === 'adolescent' ? 14 : 8,
      avatar: 'gau-rounded-pixel',
    }),
  });

  const refreshed = await request(`/families/overview?email=${encodeURIComponent(parentEmail)}`, {
    headers: authHeaders(token),
  });
  const created = (refreshed.minorProfiles ?? []).find((minor) => minor.role === role);
  assert(created, `failed to provision ${role} profile`);
  return created;
}

async function ensurePresenceApproval(token, minorProfileId) {
  const approvals = await request(
    `/parent-approvals?targetId=${encodeURIComponent(minorProfileId)}&approvalType=presence_enabled`,
    {
      headers: authHeaders(token),
    },
  );

  if ((approvals ?? []).some((approval) => approval.status === 'active')) {
    return;
  }

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      approvalType: 'presence_enabled',
      targetId: minorProfileId,
      metadata: { source: 'test-monitored-interactions' },
    }),
  });
}

async function testMinor(role, token) {
  const minor = await ensureMinor(role, token);
  await ensurePresenceApproval(token, minor.id);
  const policy = await request(`/interaction-policies/${minor.id}`, {
    headers: authHeaders(token),
  });

  const rooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(token),
  });
  assert(
    rooms.allowed === policy.roomsEnabled,
    `${role} rooms.allowed should match policy.roomsEnabled`,
  );

  if (!rooms.allowed) {
    console.log(`[ok] ${role}: rooms blocked by policy as expected`);
    return;
  }

  assert(Array.isArray(rooms.items) && rooms.items.length > 0, `${role} should expose structured rooms`);
  const room = rooms.items[0];

  const join = await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: role === 'adolescent' ? 'adolescent' : 'child',
    }),
  });
  assert(join.activeRoomId === room.id, `${role} join should return active room id`);

  const presence = await request('/presence/heartbeat', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      roomId: room.id,
      minorProfileId: minor.id,
      activeShell: role === 'adolescent' ? 'adolescent' : 'child',
    }),
  });
  assert(
    typeof presence.participantCount === 'number' && presence.participantCount >= 1,
    `${role} heartbeat should register monitored presence`,
  );

  const presenceView = await request(`/presence/${room.id}?minorProfileId=${minor.id}`, {
    headers: authHeaders(token),
  });
  assert(
    presenceView.participantCount >= 1 || presenceView.status === 'disabled',
    `${role} presence view should reflect joined room`,
  );

  const leave = await request(`/rooms/${room.id}/leave`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: role === 'adolescent' ? 'adolescent' : 'child',
    }),
  });
  assert(
    leave.activeRoomId === null || leave.activeRoomId === undefined,
    `${role} leave should clear active room`,
  );

  console.log(`[ok] ${role}: rooms/presence validated via ${room.id}`);
}

async function main() {
  const login = await request('/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parentEmail,
      name: parentName,
    }),
  });
  const token = login.accessToken;
  assert(token, 'dev login token missing');

  await testMinor('child', token);
  await testMinor('adolescent', token);
  console.log('[ok] monitored interactions validated');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
