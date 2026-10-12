import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { DEFAULT_PAGE_LIMIT, Page } from '../common/page.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const bookInclude = {
  owner: { select: { id: true, name: true } },
} satisfies Prisma.BookInclude;

export type BookWithOwner = Prisma.BookGetPayload<{
  include: typeof bookInclude;
}>;

export interface CreateBookInput {
  name: string;
  author: string;
  photoUrl: string;
}

export interface ListBooksFilter {
  search?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class BooksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  create(
    owner: AuthenticatedUser,
    input: CreateBookInput,
  ): Promise<BookWithOwner> {
    return this.prisma.book.create({
      data: { ...input, ownerId: owner.id },
      include: bookInclude,
    });
  }

  /** One page of Books, ordered by name (case-insensitive), then by id. */
  async list({
    search,
    ownerId,
    page = 1,
    limit = DEFAULT_PAGE_LIMIT,
  }: ListBooksFilter = {}): Promise<Page<BookWithOwner>> {
    const term = search?.trim();
    // Prisma cannot order case-insensitively, so ids and total come from SQL.
    const matches = [
      Prisma.sql`TRUE`,
      ...(ownerId ? [Prisma.sql`"ownerId" = ${ownerId}`] : []),
      ...(term
        ? [
            Prisma.sql`(position(lower(${term}) in lower(name)) > 0
              OR position(lower(${term}) in lower(author)) > 0)`,
          ]
        : []),
    ];
    const condition = Prisma.join(matches, ' AND ');
    const [rows, [{ count }]] = await Promise.all([
      this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Book"
        WHERE ${condition}
        ORDER BY lower(name), id
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) AS count FROM "Book" WHERE ${condition}`,
    ]);
    const total = Number(count);

    const ids = rows.map(({ id }) => id);
    const found = await this.prisma.book.findMany({
      where: { id: { in: ids } },
      include: bookInclude,
    });
    const byId = new Map(found.map((book) => [book.id, book]));
    const items = ids.flatMap((id) => byId.get(id) ?? []);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<BookWithOwner> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: bookInclude,
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  /** The Owner may remove their own Book; an Admin may remove any Book. */
  async remove(actor: AuthenticatedUser, id: string): Promise<void> {
    const book = await this.findById(id);
    if (book.ownerId !== actor.id && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only remove your own Books');
    }
    await this.prisma.book.delete({ where: { id } });
  }
}
