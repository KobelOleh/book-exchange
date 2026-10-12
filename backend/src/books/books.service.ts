import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../common/authenticated-user.js';
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

  list({ search, ownerId }: ListBooksFilter = {}): Promise<BookWithOwner[]> {
    const term = search?.trim();
    return this.prisma.book.findMany({
      where: {
        ...(ownerId && { ownerId }),
        ...(term && {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { author: { contains: term, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: bookInclude,
    });
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
