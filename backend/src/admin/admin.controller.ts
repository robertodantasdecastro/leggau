import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { FamiliesService } from '../families/families.service';
import { UpsertAuthProviderConfigDto } from '../identity-providers/dto/upsert-auth-provider-config.dto';
import { LegalService } from '../legal/legal.service';
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

  @Post('dev/cloudflare-alias/sync')
  syncCloudflareAlias() {
    return this.adminService.syncCloudflareAlias();
  }
}
