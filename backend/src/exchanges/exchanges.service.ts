import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExchangeNotifier } from './exchange-notifier.js';

const bookSelect = {
  id: true,
  name: true,
  author: true,
  photoUrl: true,
} satisfies Prisma.BookSelect;

const exchangeRequestInclude = {
  requester: { select: { id: true, name: true, email: true } },
  requestedBook: {
    select: {
      ...bookSelect,
      owner: { select: { id: true, name: true, email: true } },
    },
  },
  offeredBooks: { select: bookSelect },
} satisfies Prisma.ExchangeRequestInclude;

export type ExchangeRequestDetails = Prisma.ExchangeRequestGetPayload<{
  include: typeof exchangeRequestInclude;
}>;

export interface CreateExchangeRequestInput {
  requestedBookId: string;
  offeredBookIds: string[];
}

@Injectable()
export class ExchangesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ExchangeNotifier) private readonly notifier: ExchangeNotifier,
  ) {}

  async create(
    requester: AuthenticatedUser,
    { requestedBookId, offeredBookIds }: CreateExchangeRequestInput,
  ): Promise<ExchangeRequestDetails> {
    const requestedBook = await this.prisma.book.findUnique({
      where: { id: requestedBookId },
      select: { ownerId: true },
    });
    if (!requestedBook) {
      throw new NotFoundException('Requested Book not found');
    }
    if (requestedBook.ownerId === requester.id) {
      throw new BadRequestException('You cannot request your own Book');
    }

    const uniqueOfferedIds = [...new Set(offeredBookIds)];
    if (uniqueOfferedIds.length === 0) {
      throw new BadRequestException('Offer at least one Book');
    }
    const ownedCount = await this.prisma.book.count({
      where: { id: { in: uniqueOfferedIds }, ownerId: requester.id },
    });
    if (ownedCount !== uniqueOfferedIds.length) {
      throw new BadRequestException(
        'Every Offered Book must exist and belong to you',
      );
    }

    const request = await this.prisma.exchangeRequest.create({
      data: {
        requesterId: requester.id,
        requestedBookId,
        offeredBooks: { connect: uniqueOfferedIds.map((id) => ({ id })) },
      },
      include: exchangeRequestInclude,
    });

    this.notifier.notify({
      recipient: request.requestedBook.owner,
      requester: request.requester,
      requestedBook: request.requestedBook,
      offeredBooks: request.offeredBooks,
    });

    return request;
  }

  /** ExchangeRequests the caller has sent. */
  listSent(requester: AuthenticatedUser): Promise<ExchangeRequestDetails[]> {
    return this.prisma.exchangeRequest.findMany({
      where: { requesterId: requester.id },
      orderBy: { createdAt: 'desc' },
      include: exchangeRequestInclude,
    });
  }

  /** ExchangeRequests addressed to the caller as Owner of the Requested Book. */
  listReceived(owner: AuthenticatedUser): Promise<ExchangeRequestDetails[]> {
    return this.prisma.exchangeRequest.findMany({
      where: { requestedBook: { ownerId: owner.id } },
      orderBy: { createdAt: 'desc' },
      include: exchangeRequestInclude,
    });
  }
}
