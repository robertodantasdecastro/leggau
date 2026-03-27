import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { FamiliesService } from '../families/families.service';
import { UpsertAuthProviderConfigDto } from '../identity-providers/dto/upsert-auth-provider-config.dto';
import { UpdateInteractionPolicyDto } from '../interaction-policies/dto/update-interaction-policy.dto';
import { InteractionPoliciesService } from '../interaction-policies/interaction-policies.service';
import { InvitesService } from '../invites/invites.service';
import { UpdateInviteDto } from '../invites/dto/update-invite.dto';
import { LegalService } from '../legal/legal.service';
import { RoomsService } from '../rooms/rooms.service';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './admin-token.guard';

@UseGuards(AdminTokenGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly billingService: BillingService,
    private readonly legalService: LegalService,
    private readonly familiesService: FamiliesService,
    private readonly interactionPoliciesService: InteractionPoliciesService,
    private readonly invitesService: InvitesService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('realtime')
  realtime() {
    return this.adminService.getRealtime();
  }

  @Get('users')
  users() {
    return this.adminService.getUsers();
  }

  @Get('auth/providers')
  authProviders() {
    return this.adminService.listAuthProviders();
  }

  @Post('auth/providers')
  createAuthProvider(
    @Body() body: UpsertAuthProviderConfigDto,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.adminService.upsertAuthProvider(body, request.adminSession);
  }

  @Patch('auth/providers/:provider')
  updateAuthProvider(
    @Param('provider') provider: string,
    @Body() body: Partial<UpsertAuthProviderConfigDto>,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.adminService.upsertAuthProvider({
      ...body,
      provider,
    }, request.adminSession);
  }

  @Get('media-verification/jobs')
  mediaVerificationJobs() {
    return this.adminService.listMediaVerificationJobs();
  }

  @Get('users/segments')
  userSegments() {
    return this.adminService.getUserSegments();
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.adminService.resetUserPassword(id);
  }

  @Get('system/resources')
  systemResources() {
    return this.adminService.getSystemResources();
  }

  @Get('system/services')
  systemServices() {
    return this.adminService.getSystemServices();
  }

  @Get('billing/overview')
  billingOverview() {
    return this.billingService.getOverview();
  }

  @Get('billing/providers')
  billingProviders() {
    return this.billingService.listProviders();
  }

  @Post('billing/providers')
  createBillingProvider(@Body() body: Record<string, unknown>) {
    return this.billingService.createProvider(body);
  }

  @Patch('billing/providers/:id')
  updateBillingProvider(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.billingService.updateProvider(id, body);
  }

  @Get('billing/plans')
  billingPlans() {
    return this.billingService.listPlans();
  }

  @Post('billing/plans')
  createBillingPlan(@Body() body: Record<string, unknown>) {
    return this.billingService.createPlan(body);
  }

  @Get('billing/transactions')
  billingTransactions() {
    return this.billingService.listTransactions();
  }

  @Get('billing/webhooks')
  billingWebhooks() {
    return this.billingService.listWebhookEvents();
  }

  @Get('legal/documents')
  legalDocuments() {
    return this.legalService.getDocuments();
  }

  @Get('family/overview')
  familyOverview() {
    return this.familiesService.getOverview();
  }

  @Get('interaction-policies/:minorProfileId')
  interactionPolicy(
    @Param('minorProfileId') minorProfileId: string,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.interactionPoliciesService.getByMinorForAdmin(
      minorProfileId,
      request.adminSession,
    );
  }

  @Patch('interaction-policies/:minorProfileId')
  updateInteractionPolicy(
    @Param('minorProfileId') minorProfileId: string,
    @Body() body: UpdateInteractionPolicyDto,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.interactionPoliciesService.updateByMinorForAdmin(
      minorProfileId,
      body,
      request.adminSession,
    );
  }

  @Get('rooms/presence')
  monitoredPresence(
    @Query('roomId') roomId: string | undefined,
    @Query('minorRole') minorRole: string | undefined,
    @Query('actorRole') actorRole: string | undefined,
    @Query('accessSource') accessSource: string | undefined,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.roomsService.listPresenceForAdmin(request.adminSession, {
      roomId,
      minorRole,
      actorRole,
      accessSource,
    });
  }

  @Get('rooms/events')
  monitoredRuntimeEvents(
    @Query('roomId') roomId: string | undefined,
    @Query('minorProfileId') minorProfileId: string | undefined,
    @Query('actorRole') actorRole: string | undefined,
    @Query('eventType') eventType: string | undefined,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.roomsService.listRuntimeEventsForAdmin(request.adminSession, {
      roomId,
      minorProfileId,
      actorRole,
      eventType,
    });
  }

  @Get('rooms/:roomId/snapshot')
  monitoredRoomSnapshot(
    @Param('roomId') roomId: string,
    @Query('minorProfileId') minorProfileId: string,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.roomsService.getRoomSnapshotForAdmin(roomId, minorProfileId, request.adminSession);
  }

  @Post('rooms/:roomId/terminate')
  terminateMonitoredRoom(
    @Param('roomId') roomId: string,
    @Body() body: { minorProfileId: string; lockMinutes?: number; message?: string },
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.roomsService.terminateRoomForAdmin(roomId, body, request.adminSession);
  }

  @Post('rooms/:roomId/participants/remove')
  removeMonitoredRoomParticipant(
    @Param('roomId') roomId: string,
    @Body()
    body: {
      minorProfileId: string;
      actorRole: string;
      actorUserId?: string;
      lockMinutes?: number;
      message?: string;
    },
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.roomsService.removeParticipantForAdmin(roomId, body, request.adminSession);
  }

  @Patch('invites/:id')
  updateInvite(
    @Param('id') id: string,
    @Body() body: UpdateInviteDto,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.invitesService.updateAsAdmin(id, body, request.adminSession);
  }

  @Post('dev/cloudflare-alias/sync')
  syncCloudflareAlias() {
    return this.adminService.syncCloudflareAlias();
  }
}
