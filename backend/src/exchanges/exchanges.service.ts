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

type StoredExchangeRequest = Prisma.ExchangeRequestGetPayload<{
  include: typeof exchangeRequestInclude;
}>;

/**
 * What the API returns. The Requester sees who owns the Requested Book but not
 * their email; only the Owner (via the notification and the received list)
 * learns the Requester's email.
 */
export type ExchangeRequestDetails = Omit<
  StoredExchangeRequest,
  'requestedBook'
> & {
  requestedBook: Omit<StoredExchangeRequest['requestedBook'], 'owner'> & {
    owner: { id: string; name: string };
  };
};

function toDetails(request: StoredExchangeRequest): ExchangeRequestDetails {
  const { email: _ownerEmail, ...owner } = request.requestedBook.owner;
  return { ...request, requestedBook: { ...request.requestedBook, owner } };
}

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

    return toDetails(request);
  }

  /** ExchangeRequests the caller has sent. */
  listSent(requester: AuthenticatedUser): Promise<ExchangeRequestDetails[]> {
    return this.list({ requesterId: requester.id });
  }

  /** ExchangeRequests addressed to the caller as Owner of the Requested Book. */
  listReceived(owner: AuthenticatedUser): Promise<ExchangeRequestDetails[]> {
    return this.list({ requestedBook: { ownerId: owner.id } });
  }

  private async list(
    where: Prisma.ExchangeRequestWhereInput,
  ): Promise<ExchangeRequestDetails[]> {
    const requests = await this.prisma.exchangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: exchangeRequestInclude,
    });
    return requests.map(toDetails);
  }
}
