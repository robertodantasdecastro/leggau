#!/usr/bin/env node

const baseUrl =
  process.env.LEGGAU_BASE_URL ??
  process.env.DEV_API_ALIAS_URL ??
  'http://10.211.55.22:8080/api';
const runId = Date.now().toString();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(label, detail) {
  console.log(`[ok] ${label}: ${detail}`);
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `Request failed ${response.status} ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
    );
  }

  return body;
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
  const parentEmail = `lifecycle-parent.${runId}@leggau.local`;
  const parentRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parentEmail,
      password: 'Parent123!',
      displayName: 'Guardia Lifecycle',
      role: 'parent_guardian',
    }),
  });
  const parentToken = parentRegister.accessToken;
  assert(parentToken, 'missing parent token');

  await ensureParentConsents(parentEmail);

  const minor = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      name: 'Lia Lifecycle',
      age: 8,
      avatar: 'gau-rounded-pixel',
    }),
  });
  assert(minor.id, 'minor profile should exist');

  await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'presence_enabled',
      targetId: minor.id,
      metadata: { source: 'test-runtime-lifecycle' },
    }),
  });

  await request(`/interaction-policies/${minor.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      roomsEnabled: true,
      presenceEnabled: true,
      therapistParticipationAllowed: false,
    }),
  });

  const rooms = await request(`/rooms?minorProfileId=${minor.id}`, {
    headers: authHeaders(parentToken),
  });
  assert(rooms.allowed === true && rooms.items.length > 0, 'room catalog should be available');
  const room = rooms.items[0];

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
  logStep('runtime seeded', `${room.id} entrou em estado ativo`);

  const activePresence = await request(
    `/presence/${encodeURIComponent(room.id)}?minorProfileId=${encodeURIComponent(minor.id)}`,
    { headers: authHeaders(parentToken) },
  );
  assert(activePresence.sessionStatus === 'active', 'presence should start active');
  logStep('active lifecycle', `sessionStatus=${activePresence.sessionStatus}`);

  await sleep(50_000);

  const stalePresence = await request(
    `/presence/${encodeURIComponent(room.id)}?minorProfileId=${encodeURIComponent(minor.id)}`,
    { headers: authHeaders(parentToken) },
  );
  assert(stalePresence.sessionStatus === 'stale', 'presence should move to stale after inactivity');
  logStep('stale lifecycle', `sessionStatus=${stalePresence.sessionStatus}`);

  await sleep(50_000);

  const timeoutPresence = await request(
    `/presence/${encodeURIComponent(room.id)}?minorProfileId=${encodeURIComponent(minor.id)}`,
    { headers: authHeaders(parentToken) },
  );
  assert(
    timeoutPresence.sessionStatus === 'closed_by_timeout',
    `expected closed_by_timeout, received ${timeoutPresence.sessionStatus}`,
  );
  assert(
    (timeoutPresence.closeReason ?? '').includes('heartbeat') ||
      (timeoutPresence.closeReason ?? '').includes('timeout'),
    'timeout presence should explain why the session ended',
  );
  logStep('timeout lifecycle', timeoutPresence.closeReason ?? timeoutPresence.sessionStatus);

  const joinAfterTimeout = await request(`/rooms/${room.id}/join`, {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      minorProfileId: minor.id,
      activeShell: 'child',
    }),
  });
  assert(joinAfterTimeout.sessionStatus === 'active', 'join after timeout should recover the session');
  logStep('recovery', `sessionStatus=${joinAfterTimeout.sessionStatus}`);

  console.log('[ok] runtime lifecycle suite completed');
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exitCode = 1;
});
