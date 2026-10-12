import { Module } from '@nestjs/common';
import { ExchangeNotifier } from './exchange-notifier.js';
import { ExchangesController } from './exchanges.controller.js';
import { ExchangesService } from './exchanges.service.js';

@Module({
  controllers: [ExchangesController],
  providers: [ExchangesService, ExchangeNotifier],
})
export class ExchangesModule {}
