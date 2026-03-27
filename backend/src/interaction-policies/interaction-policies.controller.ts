import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { UpdateInteractionPolicyDto } from './dto/update-interaction-policy.dto';
import { InteractionPoliciesService } from './interaction-policies.service';

@UseGuards(AppTokenGuard)
@Controller('interaction-policies')
export class InteractionPoliciesController {
  constructor(private readonly interactionPoliciesService: InteractionPoliciesService) {}

  @Get(':minorProfileId')
  get(
    @Param('minorProfileId') minorProfileId: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.interactionPoliciesService.getByMinor(minorProfileId, request.appSession);
  }

  @Patch(':minorProfileId')
  update(
    @Param('minorProfileId') minorProfileId: string,
    @Body() dto: UpdateInteractionPolicyDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.interactionPoliciesService.updateByMinor(
      minorProfileId,
      dto,
      request.appSession,
    );
  }
}
