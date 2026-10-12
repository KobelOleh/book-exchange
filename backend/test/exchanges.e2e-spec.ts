import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ExchangeNotifier } from '../src/exchanges/exchange-notifier.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, registerAgent } from './support/http.js';
import { resetDatabase } from './support/test-module.js';

type Agent = ReturnType<typeof request.agent>;

describe('ExchangeRequests (HTTP)', () => {
  let app: INestApplication;
  const notify = vi.fn();

  let olena: { agent: Agent; id: string };
  let taras: { agent: Agent; id: string };
  let olenaBookId: string;
  let tarasBookIds: string[];

  async function addBook(agent: Agent, name: string): Promise<string> {
    const { body } = await agent
      .post('/api/books')
      .send({ name, author: 'Author', photoUrl: 'https://example.com/c.jpg' })
      .expect(201);
    return body.id;
  }

  beforeAll(async () => {
    app = await createApp();
    vi.spyOn(app.get(ExchangeNotifier), 'notify').mockImplementation(notify);
  });

  beforeEach(async () => {
    notify.mockClear();
    await resetDatabase(app.get(PrismaService));
    olena = await registerAgent(app, 'Olena');
    taras = await registerAgent(app, 'Taras');
    olenaBookId = await addBook(olena.agent, 'Dune');
    tarasBookIds = [
      await addBook(taras.agent, 'Emma'),
      await addBook(taras.agent, 'Ulysses'),
    ];
  });

  afterAll(async () => {
    await app.close();
  });

  it('turns away anonymous visitors', async () => {
    await request(app.getHttpServer())
      .post('/api/exchange-requests')
      .send({ requestedBookId: olenaBookId, offeredBookIds: tarasBookIds })
      .expect(401);
  });

  it('records a request, notifies the Owner and shows it to both sides', async () => {
    const created = await taras.agent
      .post('/api/exchange-requests')
      .send({ requestedBookId: olenaBookId, offeredBookIds: tarasBookIds })
      .expect(201);

    const sent = await taras.agent
      .get('/api/exchange-requests/sent')
      .expect(200);
    const received = await olena.agent
      .get('/api/exchange-requests/received')
      .expect(200);
    const olenaSent = await olena.agent
      .get('/api/exchange-requests/sent')
      .expect(200);

    expect(created.body.offeredBooks).toHaveLength(2);
    expect(sent.body.map((r: { id: string }) => r.id)).toEqual([
      created.body.id,
    ]);
    expect(received.body.map((r: { id: string }) => r.id)).toEqual([
      created.body.id,
    ]);
    expect(olenaSent.body).toEqual([]);
    expect(notify).toHaveBeenCalledOnce();
    expect(notify.mock.calls[0]![0]).toMatchObject({
      recipient: { email: 'olena@example.com' },
      requester: { name: 'Taras' },
    });
  });

  it('refuses a request for the Requester’s own Book', async () => {
    const otherBookId = await addBook(olena.agent, 'Other');

    await olena.agent
      .post('/api/exchange-requests')
      .send({ requestedBookId: olenaBookId, offeredBookIds: [otherBookId] })
      .expect(400);
    expect(notify).not.toHaveBeenCalled();
  });

  it('refuses Offered Books the Requester does not own', async () => {
    await taras.agent
      .post('/api/exchange-requests')
      .send({ requestedBookId: olenaBookId, offeredBookIds: [olenaBookId] })
      .expect(400);
    expect(notify).not.toHaveBeenCalled();
  });

  it('validates the payload', async () => {
    const post = (body: object) =>
      taras.agent.post('/api/exchange-requests').send(body);

    await post({ requestedBookId: olenaBookId, offeredBookIds: [] }).expect(
      400,
    );
    await post({
      requestedBookId: 'nope',
      offeredBookIds: tarasBookIds,
    }).expect(400);
    await post({
      requestedBookId: olenaBookId,
      offeredBookIds: [tarasBookIds[0], tarasBookIds[0]],
    }).expect(400);
    await post({
      requestedBookId: '00000000-0000-4000-8000-000000000000',
      offeredBookIds: tarasBookIds,
    }).expect(404);
  });
});
