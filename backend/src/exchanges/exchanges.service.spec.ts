import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  createTestModule,
  resetDatabase,
} from '../../test/support/test-module.js';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExchangeNotifier } from './exchange-notifier.js';
import { ExchangesModule } from './exchanges.module.js';
import { ExchangesService } from './exchanges.service.js';

describe('ExchangesService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let exchanges: ExchangesService;
  const notify = vi.fn();

  let olena: AuthenticatedUser;
  let taras: AuthenticatedUser;
  let olenaBookId: string;
  let tarasBookIds: string[];

  const photoUrl = 'https://example.com/cover.jpg';

  async function createUser(email: string, name: string) {
    const { id } = await prisma.user.create({
      data: { email, name, passwordHash: 'x' },
    });
    return { id, role: Role.USER } satisfies AuthenticatedUser;
  }

  async function createBook(ownerId: string, name: string) {
    const { id } = await prisma.book.create({
      data: { name, author: 'Author', photoUrl, ownerId },
    });
    return id;
  }

  beforeAll(async () => {
    moduleRef = await createTestModule([ExchangesModule]);
    prisma = moduleRef.get(PrismaService);
    exchanges = moduleRef.get(ExchangesService);
    vi.spyOn(moduleRef.get(ExchangeNotifier), 'notify').mockImplementation(
      notify,
    );
  });

  beforeEach(async () => {
    notify.mockClear();
    await resetDatabase(prisma);
    olena = await createUser('olena@example.com', 'Olena');
    taras = await createUser('taras@example.com', 'Taras');
    olenaBookId = await createBook(olena.id, 'Dune');
    tarasBookIds = [
      await createBook(taras.id, 'Emma'),
      await createBook(taras.id, 'Ulysses'),
    ];
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('stores the request with its Offered Books and notifies the Owner', async () => {
    const request = await exchanges.create(taras, {
      requestedBookId: olenaBookId,
      offeredBookIds: tarasBookIds,
    });

    expect(request.requester.id).toBe(taras.id);
    expect(request.requestedBook.id).toBe(olenaBookId);
    expect(request.offeredBooks.map((b) => b.name).sort()).toEqual([
      'Emma',
      'Ulysses',
    ]);
    expect(await prisma.exchangeRequest.count()).toBe(1);
    expect(notify).toHaveBeenCalledOnce();
    expect(notify.mock.calls[0]![0]).toMatchObject({
      recipient: { email: 'olena@example.com' },
      requester: { name: 'Taras' },
      requestedBook: { name: 'Dune' },
    });
    expect(notify.mock.calls[0]![0].offeredBooks).toHaveLength(2);
  });

  it('rejects a request for the Requester’s own Book', async () => {
    await expect(
      exchanges.create(olena, {
        requestedBookId: olenaBookId,
        offeredBookIds: [await createBook(olena.id, 'Other')],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(notify).not.toHaveBeenCalled();
  });

  it('rejects an Offered Book that belongs to someone else', async () => {
    await expect(
      exchanges.create(taras, {
        requestedBookId: olenaBookId,
        offeredBookIds: [olenaBookId],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.exchangeRequest.count()).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('rejects an empty offer', async () => {
    await expect(
      exchanges.create(taras, {
        requestedBookId: olenaBookId,
        offeredBookIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing Requested Book', async () => {
    await expect(
      exchanges.create(taras, {
        requestedBookId: '00000000-0000-4000-8000-000000000000',
        offeredBookIds: tarasBookIds,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists sent requests for the Requester and received ones for the Owner', async () => {
    await exchanges.create(taras, {
      requestedBookId: olenaBookId,
      offeredBookIds: tarasBookIds,
    });

    expect(await exchanges.listSent(taras)).toHaveLength(1);
    expect(await exchanges.listSent(olena)).toHaveLength(0);
    expect(await exchanges.listReceived(olena)).toHaveLength(1);
    expect(await exchanges.listReceived(taras)).toHaveLength(0);
  });

  it('removes requests when the Requested Book is deleted', async () => {
    await exchanges.create(taras, {
      requestedBookId: olenaBookId,
      offeredBookIds: tarasBookIds,
    });

    await prisma.book.delete({ where: { id: olenaBookId } });

    expect(await prisma.exchangeRequest.count()).toBe(0);
  });
});
