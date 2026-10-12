import { Injectable, Logger } from '@nestjs/common';

/** The message the Owner receives about an ExchangeRequest. */
export interface ExchangeNotification {
  recipient: { name: string; email: string };
  requester: { name: string; email: string };
  requestedBook: { name: string; author: string };
  offeredBooks: { name: string; author: string }[];
}

/** Delivers Exchange Notifications. For the demo it writes them to the console. */
@Injectable()
export class ExchangeNotifier {
  private readonly logger = new Logger(ExchangeNotifier.name);

  notify({
    recipient,
    requester,
    requestedBook,
    offeredBooks,
  }: ExchangeNotification): void {
    const offered = offeredBooks
      .map((book) => `"${book.name}" by ${book.author}`)
      .join(', ');
    this.logger.log(
      `Email to ${recipient.email}: ${requester.name} (${requester.email}) ` +
        `wants your "${requestedBook.name}" by ${requestedBook.author} ` +
        `and offers: ${offered}`,
    );
  }
}
