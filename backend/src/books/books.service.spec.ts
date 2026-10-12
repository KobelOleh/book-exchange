import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  createTestModule,
  resetDatabase,
} from '../../test/support/test-module.js';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BooksModule } from './books.module.js';
import { BooksService } from './books.service.js';

describe('BooksService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let books: BooksService;

  let olena: AuthenticatedUser;
  let taras: AuthenticatedUser;
  let admin: AuthenticatedUser;

  const photoUrl = 'https://example.com/cover.jpg';

  async function createUser(
    email: string,
    role: Role = Role.USER,
  ): Promise<AuthenticatedUser> {
    const { id } = await prisma.user.create({
      data: { email, name: email, passwordHash: 'x', role },
    });
    return { id, role };
  }

  beforeAll(async () => {
    moduleRef = await createTestModule([BooksModule]);
    prisma = moduleRef.get(PrismaService);
    books = moduleRef.get(BooksService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    olena = await createUser('olena@example.com');
    taras = await createUser('taras@example.com');
    admin = await createUser('admin@example.com', Role.ADMIN);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates a Book owned by the caller', async () => {
    const book = await books.create(olena, {
      name: 'Dune',
      author: 'Frank Herbert',
      photoUrl,
    });

    expect(book).toMatchObject({ name: 'Dune', ownerId: olena.id });
    expect(book.owner.id).toBe(olena.id);
  });

  it('lists Books from every Owner alphabetically, ignoring case', async () => {
    await books.create(olena, { name: 'emma', author: 'Austen', photoUrl });
    await books.create(taras, { name: 'Dune', author: 'Herbert', photoUrl });
    await books.create(olena, { name: 'Anna', author: 'Tolstoy', photoUrl });

    const { items } = await books.list();

    expect(items.map((b) => b.name)).toEqual(['Anna', 'Dune', 'emma']);
  });

  it('pages the list and reports the total', async () => {
    for (const name of ['A', 'B', 'C', 'D', 'E']) {
      await books.create(olena, { name, author: 'x', photoUrl });
    }

    const second = await books.list({ page: 2, limit: 2 });
    const past = await books.list({ page: 9, limit: 2 });

    expect(second.items.map((b) => b.name)).toEqual(['C', 'D']);
    expect(second).toMatchObject({ total: 5, page: 2, limit: 2 });
    expect(past.items).toEqual([]);
    expect(past.total).toBe(5);
  });

  it('counts only matching Books and treats search wildcards literally', async () => {
    await books.create(olena, { name: '100% Pure', author: 'x', photoUrl });
    await books.create(olena, { name: 'Dune', author: 'x', photoUrl });

    const found = await books.list({ search: '%', limit: 1 });

    expect(found.items.map((b) => b.name)).toEqual(['100% Pure']);
    expect(found.total).toBe(1);
  });

  it('searches by name or author, ignoring case', async () => {
    await books.create(olena, { name: 'Dune', author: 'Herbert', photoUrl });
    await books.create(olena, {
      name: 'Emma',
      author: 'Jane Austen',
      photoUrl,
    });

    const { items: byName } = await books.list({ search: 'dUNe' });
    const { items: byAuthor } = await books.list({ search: 'austen' });

    expect(byName.map((b) => b.name)).toEqual(['Dune']);
    expect(byAuthor.map((b) => b.name)).toEqual(['Emma']);
  });

  it('restricts the list to one Owner', async () => {
    await books.create(olena, { name: 'Dune', author: 'Herbert', photoUrl });
    await books.create(taras, { name: 'Emma', author: 'Austen', photoUrl });

    const { items: list } = await books.list({ ownerId: taras.id });

    expect(list.map((b) => b.name)).toEqual(['Emma']);
  });

  it('lets the Owner remove their Book', async () => {
    const book = await books.create(olena, {
      name: 'Dune',
      author: 'Herbert',
      photoUrl,
    });

    await books.remove(olena, book.id);

    await expect(books.findById(book.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets an Admin remove any Book', async () => {
    const book = await books.create(olena, {
      name: 'Dune',
      author: 'Herbert',
      photoUrl,
    });

    await books.remove(admin, book.id);

    expect((await books.list()).items).toHaveLength(0);
  });

  it('forbids a User from removing a Book they do not own', async () => {
    const book = await books.create(olena, {
      name: 'Dune',
      author: 'Herbert',
      photoUrl,
    });

    await expect(books.remove(taras, book.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect((await books.list()).items).toHaveLength(1);
  });

  it('reports a missing Book as not found', async () => {
    await expect(
      books.remove(admin, '00000000-0000-4000-8000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
