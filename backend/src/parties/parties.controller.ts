import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemberReviewDto } from '../trust/dto/member-review.dto';
import { NoShowReportDto } from '../trust/dto/no-show-report.dto';
import { PartyReviewDto } from '../trust/dto/party-review.dto';
import { TrustService } from '../trust/trust.service';
import { PartiesService } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { SearchPartiesQueryDto } from './dto/search-parties-query.dto';
import { ConfirmArrivalDto } from './dto/confirm-arrival.dto';
import { SetTaxiFareDto } from './dto/set-taxi-fare.dto';
import type { Request } from 'express';
import type { JwtUserPayload } from '../auth/auth.service';

type AuthenticatedRequest = Request & { user: JwtUserPayload };

@Controller('parties')
export class PartiesController {
  constructor(
    private readonly partiesService: PartiesService,
    private readonly trustService: TrustService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createParty(@Req() req: AuthenticatedRequest, @Body() dto: CreatePartyDto) {
    return this.partiesService.createParty(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchParties(@Req() req: AuthenticatedRequest, @Query() dto: SearchPartiesQueryDto) {
    return this.partiesService.searchParties(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyParties(@Req() req: AuthenticatedRequest) {
    return this.partiesService.getMyActiveParties(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/history')
  getMyPartyHistory(@Req() req: AuthenticatedRequest) {
    return this.trustService.getHistoryItems(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':partyId')
  getParty(@Req() req: AuthenticatedRequest, @Param('partyId', ParseUUIDPipe) partyId: string) {
    return this.partiesService.getPartyDetail(req.user, partyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/join')
  joinParty(@Req() req: AuthenticatedRequest, @Param('partyId', ParseUUIDPipe) partyId: string) {
    return this.partiesService.joinParty(req.user, partyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/leave')
  leaveParty(@Req() req: AuthenticatedRequest, @Param('partyId', ParseUUIDPipe) partyId: string) {
    return this.partiesService.leaveParty(req.user, partyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':partyId/messages')
  getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.partiesService.getMessages(req.user, partyId, cursor);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/messages')
  postMessage(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: { content: string },
  ) {
    return this.partiesService.postMessage(req.user, partyId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':partyId/taxi-fare')
  setTaxiFare(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: SetTaxiFareDto,
  ) {
    return this.partiesService.setTaxiFare(req.user, partyId, dto.totalTaxiFare);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/confirm-arrival')
  confirmArrival(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: ConfirmArrivalDto,
  ) {
    return this.partiesService.confirmArrival(req.user, partyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/reviews')
  submitPartyReview(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: PartyReviewDto,
  ) {
    return this.trustService.submitPartyReview(req.user, partyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/member-reviews')
  submitMemberReview(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: MemberReviewDto,
  ) {
    return this.trustService.submitMemberReview(req.user, partyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/no-show-reports')
  submitNoShowReport(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: NoShowReportDto,
  ) {
    return this.trustService.submitNoShowReport(req.user, partyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':partyId/transfer-host')
  transferHost(
    @Req() req: AuthenticatedRequest,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.trustService.transferHost(req.user, partyId, targetUserId);
  }
}

