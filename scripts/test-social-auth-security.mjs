#!/usr/bin/env node

const baseUrl = process.env.LEGGAU_BASE_URL ?? 'http://10.211.55.22:8080/api';
const adminEmail = process.env.LEGGAU_ADMIN_EMAIL ?? 'admin@leggau.local';
const adminPassword = process.env.LEGGAU_ADMIN_PASSWORD ?? 'Admin123!';
const runId = Date.now().toString();

const results = [];

function logStep(name, detail) {
  results.push({ name, detail });
  console.log(`[ok] ${name}: ${detail}`);
}

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
  logStep('admin login', 'admin token issued');

  const googleParentEmail = `helena.${runId}@leggau.local`;
  const appleTherapistEmail = `marina.${runId}@leggau.local`;

  const googleConfig = await request('/admin/auth/providers/google', {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      provider: 'google',
      enabled: true,
      verificationMode: 'mock',
      clientId: `google-client-${runId}`,
      issuer: 'https://accounts.google.com',
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      allowedAudiences: [`google-client-${runId}`],
      scopes: ['openid', 'email', 'profile'],
      clientSecret: `google-secret-${runId}`,
      metadata: {
        mockProfiles: [
          {
            subject: `google-parent-${runId}`,
            email: googleParentEmail,
            emailVerified: true,
            name: 'Helena Dantas',
            avatarUrl: 'https://example.invalid/helena.png',
          },
        ],
      },
    }),
  });
  const appleConfig = await request('/admin/auth/providers/apple', {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      provider: 'apple',
      enabled: true,
      verificationMode: 'mock',
      clientId: `com.leggau.web.${runId}`,
      issuer: 'https://appleid.apple.com',
      jwksUrl: 'https://appleid.apple.com/auth/keys',
      allowedAudiences: [`com.leggau.web.${runId}`],
      scopes: ['name', 'email'],
      privateKey: `-----BEGIN PRIVATE KEY-----\nmock-${runId}\n-----END PRIVATE KEY-----`,
      metadata: {
        teamId: `TEAM-${runId}`,
        keyId: `KEY-${runId}`,
        mockProfiles: [
          {
            subject: `apple-therapist-${runId}`,
            email: appleTherapistEmail,
            emailVerified: true,
            name: 'Marina Silva',
            avatarUrl: 'https://example.invalid/marina.png',
          },
        ],
      },
    }),
  });

  assert(googleConfig.enabled && appleConfig.enabled, 'providers should be enabled');
  logStep('provider config', 'google and apple configured in mock mode');

  const publicProviders = await request('/auth/social/providers');
  assert(
    publicProviders.some((provider) => provider.provider === 'google') &&
      publicProviders.some((provider) => provider.provider === 'apple'),
    'public provider list should expose google and apple',
  );
  logStep('public providers', 'google and apple exposed publicly');

  const passwordParentEmail = `password-parent-${runId}@leggau.local`;
  const passwordRegister = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: passwordParentEmail,
      password: 'Parent123!',
      displayName: 'Fluxo Senha',
      role: 'parent_guardian',
    }),
  });
  const passwordLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: passwordParentEmail,
      password: 'Parent123!',
    }),
  });
  assert(
    passwordRegister.user.email === passwordParentEmail &&
      passwordLogin.user.email === passwordParentEmail,
    'password register/login should remain functional',
  );
  logStep('legacy auth', 'password register and login still work');

  const passwordResetRequest = await request('/auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: passwordParentEmail }),
  });
  await request('/auth/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: passwordResetRequest.resetToken.token,
      newPassword: 'Parent456!',
    }),
  });
  const passwordRelogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: passwordParentEmail,
      password: 'Parent456!',
    }),
  });
  assert(passwordRelogin.user.email === passwordParentEmail, 'password reset failed');
  logStep('password reset', 'legacy password reset aliases still work');

  const socialParent = await request('/auth/social/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      role: 'parent_guardian',
      mockSubject: `google-parent-${runId}`,
    }),
  });
  assert(
    socialParent.actorRole === 'parent_guardian' &&
      socialParent.requirements.legalConsentRequired === true,
    'social parent should require legal consent on first login',
  );
  logStep('social parent register', 'google parent created with legal gate pending');

  const parentToken = socialParent.accessToken;
  const legalDocuments = await request('/legal/documents');
  for (const document of legalDocuments) {
    await request('/legal/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: googleParentEmail,
        documentKey: document.key,
      }),
    });
  }
  logStep('legal consent', `${legalDocuments.length} policies accepted for social parent`);

  const createdChild = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail: googleParentEmail,
      name: 'Lia',
      age: 8,
      avatar: 'gau-rounded-pixel',
    }),
  });
  const createdAdolescent = await request('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail: googleParentEmail,
      name: 'Noah',
      age: 14,
      avatar: 'gau-rounded-pixel',
    }),
  });
  assert(
    createdChild.role === 'child' && createdAdolescent.role === 'adolescent',
    'child and adolescent profiles should be created with canonical roles',
  );
  logStep('minor provisioning', 'child and adolescent created behind consent gate');

  const familyOverview = await request(
    `/families/overview?email=${encodeURIComponent(googleParentEmail)}`,
    {
      headers: authHeaders(parentToken),
    },
  );
  assert(
    (familyOverview.guardianLinks?.length ?? 0) >= 2 &&
      (familyOverview.minorProfiles?.length ?? 0) >= 2,
    'family overview should expose canonical guardian links and minor profiles',
  );
  logStep('family overview', 'guardian links and minor profiles exposed');

  const parentInvite = await request('/invites', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      inviteType: 'care_team_invite',
      targetEmail: appleTherapistEmail,
      targetActorRole: 'therapist',
      minorProfileId: createdAdolescent.id,
      metadata: {
        parentEmail: googleParentEmail,
        parentName: 'Helena Dantas',
        minorName: 'Noah',
        minorRole: 'adolescent',
        ageBand: '13-17',
      },
    }),
  });
  const parentInvites = await request(`/invites?minorProfileId=${encodeURIComponent(createdAdolescent.id)}`, {
    headers: authHeaders(parentToken),
  });
  assert(
    parentInvites.some((invite) => invite.id === parentInvite.id && invite.targetEmail === appleTherapistEmail),
    'parent invite should be visible to its creator',
  );
  logStep('invite creation', 'parent created scoped therapist invite');

  const parentApprovalRecord = await request('/parent-approvals', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      approvalType: 'therapist_linking',
      targetId: createdAdolescent.id,
      metadata: {
        channel: 'portal',
        approvedBy: 'guardian',
      },
    }),
  });
  const parentApprovalList = await request(
    `/parent-approvals?targetId=${encodeURIComponent(createdAdolescent.id)}`,
    {
      headers: authHeaders(parentToken),
    },
  );
  assert(
    parentApprovalRecord.status === 'active' &&
      parentApprovalList.some((approval) => approval.id === parentApprovalRecord.id),
    'guardian approval ledger should list explicit approvals',
  );
  logStep('parent approvals', 'guardian approval ledger is queryable by target profile');

  const socialParentRelogin = await request('/auth/social/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      role: 'parent_guardian',
      mockSubject: `google-parent-${runId}`,
    }),
  });
  assert(
    socialParentRelogin.user.id === socialParent.user.id &&
      socialParentRelogin.requirements.legalConsentRequired === false,
    'existing social parent should log in without a new account',
  );
  logStep('social parent relogin', 'existing google identity reuses the same account');

  const socialTherapist = await request('/auth/social/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'apple',
      role: 'therapist',
      mockSubject: `apple-therapist-${runId}`,
    }),
  });
  assert(
    socialTherapist.actorRole === 'therapist' &&
      socialTherapist.requirements.actorDependencies.therapistAdminApproved === false,
    'therapist should register pending admin approval',
  );
  logStep('social therapist register', 'apple therapist created pending approvals');

  const therapistToken = socialTherapist.accessToken;
  const therapistInvites = await request('/invites', {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistInvites.some((invite) => invite.id === parentInvite.id && invite.targetEmail === appleTherapistEmail),
    'therapist should see only invites addressed to their email',
  );
  await request(`/invites/${parentInvite.id}/accept`, {
    method: 'POST',
    headers: authHeaders(therapistToken),
  });
  const therapistInvitesAfterAccept = await request('/invites', {
    headers: authHeaders(therapistToken),
  });
  assert(
    therapistInvitesAfterAccept.some(
      (invite) => invite.id === parentInvite.id && invite.status === 'accepted',
    ),
    'therapist should be able to accept a scoped invite',
  );
  logStep('invite acceptance', 'therapist accepted parent-scoped invite');

  const therapistApprovalView = await request('/parent-approvals', {
    headers: authHeaders(therapistToken),
  });
  assert(
    Array.isArray(therapistApprovalView) && therapistApprovalView.length === 0,
    'therapists should not list guardian approvals from the ledger',
  );
  logStep('approval isolation', 'guardian approvals stay hidden from therapist sessions');

  const careTeamMembership = await request('/care-team', {
    method: 'POST',
    headers: authHeaders(therapistToken),
    body: JSON.stringify({
      therapistUserId: socialTherapist.user.id,
      therapistProfileId: socialTherapist.profile.id,
      parentUserId: socialParent.user.id,
      parentProfileId: socialParent.profile.id,
      minorProfileId: createdAdolescent.id,
      minorRole: 'adolescent',
      scope: {
        monitoring: true,
        interventions: 'guided',
      },
    }),
  });
  assert(careTeamMembership.status === 'pending', 'care team should start pending');

  const parentApproval = await request(`/care-team/${careTeamMembership.id}`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      parentApprovalStatus: 'approved',
    }),
  });
  assert(
    parentApproval.parentApprovalStatus === 'approved' &&
      parentApproval.status === 'pending',
    'parent approval should not activate care-team alone',
  );

  await expectFailure(`/care-team/${careTeamMembership.id}/admin`, {
    method: 'PATCH',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      adminApprovalStatus: 'approved',
    }),
  });

  const adminApproval = await request(`/care-team/${careTeamMembership.id}/admin`, {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      adminApprovalStatus: 'approved',
    }),
  });
  assert(adminApproval.status === 'active', 'admin approval should activate care-team');
  logStep('care-team approvals', 'parent and admin approvals enforced separately');

  const activities = await request('/activities');
  await request('/progress/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      childId: createdAdolescent.id,
      activityId: activities.items[0].id,
      notes: 'Check-in adolescente no shell adulto',
    }),
  });
  const adolescentSummary = await request(
    `/progress/summary?childId=${encodeURIComponent(createdAdolescent.id)}`,
  );
  assert(
    adolescentSummary.child.id === createdAdolescent.id &&
      adolescentSummary.child.role === 'adolescent' &&
      adolescentSummary.totalPoints >= activities.items[0].points,
    'adolescent progress should support canonical summary and check-in flow',
  );
  logStep('adolescent progress', 'summary and check-in work for adolescent profiles');

  const sessions = await request('/sessions', {
    headers: authHeaders(parentToken),
  });
  assert(sessions.length >= 1, 'session listing should return persistent sessions');
  logStep('sessions', `${sessions.length} persistent app sessions listed`);

  const ocrJob = await request('/media-verification', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      verificationType: 'document_ocr',
      subjectRole: 'parent_guardian',
      sampleKey: 'guardian-id-front',
    }),
  });
  const positiveBioJob = await request('/media-verification', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      verificationType: 'biometric_face_match',
      subjectRole: 'parent_guardian',
      sampleKey: 'guardian-face-match-positive',
    }),
  });
  const negativeBioJob = await request('/media-verification', {
    method: 'POST',
    headers: authHeaders(parentToken),
    body: JSON.stringify({
      verificationType: 'biometric_face_match',
      subjectRole: 'parent_guardian',
      sampleKey: 'guardian-face-match-negative',
    }),
  });
  assert(
    ocrJob.extractedData.fullName === 'Helena Dantas' &&
      positiveBioJob.matched === true &&
      negativeBioJob.reviewRequired === true,
    'media verification simulations should return expected OCR and biometric results',
  );
  logStep('media verification', 'OCR and biometric simulations passed');

  await expectFailure('/admin/overview', {
    headers: authHeaders(parentToken),
  });
  const adminProviderList = await request('/admin/auth/providers', {
    headers: authHeaders(adminToken),
  });
  assert(
    !Object.prototype.hasOwnProperty.call(adminProviderList[0], 'clientSecretEncrypted') &&
      !Object.prototype.hasOwnProperty.call(adminProviderList[0], 'privateKeyEncrypted'),
    'admin provider list must not leak encrypted secrets',
  );
  logStep('admin secret masking', 'provider secrets stay masked in admin responses');

  await request('/admin/auth/providers/google', {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      provider: 'google',
      enabled: false,
    }),
  });
  await expectFailure('/auth/social/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      role: 'parent_guardian',
      mockSubject: `google-parent-${runId}`,
    }),
  });
  logStep('provider disable security', 'disabled provider blocks social auth');

  await request('/admin/auth/providers/google', {
    method: 'PATCH',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      provider: 'google',
      enabled: true,
    }),
  });

  await expectFailure('/auth/social/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'apple',
      role: 'child',
      mockSubject: `apple-therapist-${runId}`,
    }),
  });
  logStep('role gate security', 'minor self-register via social login is rejected');

  const auditEvents = await request('/audit/events', {
    headers: authHeaders(adminToken),
  });
  assert(
    auditEvents.some((event) => event.eventType === 'auth.social_register') &&
      auditEvents.some((event) => event.eventType === 'media_verification.created'),
    'audit events should contain social auth and media verification traces',
  );
  logStep('audit trail', 'critical social auth and verification events are recorded');

  console.log('\nSummary');
  console.table(results);
}

main().catch((error) => {
  console.error('[failed]', error.message);
  process.exitCode = 1;
});
