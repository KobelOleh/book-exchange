import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/authenticated-user.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { CreateExchangeRequestDto } from './dto/create-exchange-request.dto.js';
import {
  ExchangeRequestDetails,
  ExchangesService,
} from './exchanges.service.js';

@Controller('exchange-requests')
export class ExchangesController {
  constructor(
    @Inject(ExchangesService) private readonly exchanges: ExchangesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExchangeRequestDto,
  ): Promise<ExchangeRequestDetails> {
    return this.exchanges.create(user, dto);
  }

  @Get('sent')
  listSent(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeRequestDetails[]> {
    return this.exchanges.listSent(user);
  }

  @Get('received')
  listReceived(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeRequestDetails[]> {
    return this.exchanges.listReceived(user);
  }
}
