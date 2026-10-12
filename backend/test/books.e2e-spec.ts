import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { adminAgent, createApp, registerAgent } from './support/http.js';
import { resetDatabase } from './support/test-module.js';

describe('Books (HTTP)', () => {
  let app: INestApplication;

  const dune = {
    name: 'Dune',
    author: 'Frank Herbert',
    photoUrl: 'https://example.com/dune.jpg',
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('turns away anonymous visitors', async () => {
    await request(app.getHttpServer()).get('/api/books').expect(401);
    await request(app.getHttpServer())
      .post('/api/books')
      .send(dune)
      .expect(401);
  });

  it('lets a User add a Book and shows them as its Owner', async () => {
    const olena = await registerAgent(app, 'Olena');

    const response = await olena.agent
      .post('/api/books')
      .send(dune)
      .expect(201);

    expect(response.body).toMatchObject({
      ...dune,
      ownerId: olena.id,
      owner: { id: olena.id, name: 'Olena' },
    });
  });

  it('rejects an invalid Book', async () => {
    const { agent } = await registerAgent(app, 'Olena');

    await agent
      .post('/api/books')
      .send({ ...dune, photoUrl: 'nope' })
      .expect(400);
    await agent
      .post('/api/books')
      .send({ ...dune, name: '' })
      .expect(400);
    await agent
      .post('/api/books')
      .send({ ...dune, ownerId: 'someone-else' })
      .expect(400);
  });

  it('lets any User browse, search and filter to their own Books', async () => {
    const olena = await registerAgent(app, 'Olena');
    const taras = await registerAgent(app, 'Taras');
    await olena.agent.post('/api/books').send(dune).expect(201);
    await taras.agent
      .post('/api/books')
      .send({ ...dune, name: 'Emma', author: 'Jane Austen' })
      .expect(201);

    const all = await olena.agent.get('/api/books').expect(200);
    const search = await olena.agent
      .get('/api/books?search=AUSTEN')
      .expect(200);
    const mine = await olena.agent.get('/api/books?mine=true').expect(200);

    expect(all.body).toMatchObject({ total: 2, page: 1, limit: 12 });
    expect(search.body.items.map((b: { name: string }) => b.name)).toEqual([
      'Emma',
    ]);
    expect(mine.body.items.map((b: { name: string }) => b.name)).toEqual([
      'Dune',
    ]);
  });

  it('pages the list and rejects bad paging', async () => {
    const { agent } = await registerAgent(app, 'Olena');
    for (const name of ['B', 'A', 'C']) {
      await agent
        .post('/api/books')
        .send({ ...dune, name })
        .expect(201);
    }

    const page = await agent.get('/api/books?page=2&limit=2').expect(200);

    expect(page.body.items.map((b: { name: string }) => b.name)).toEqual(['C']);
    expect(page.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    await agent.get('/api/books?limit=101').expect(400);
    await agent.get('/api/books?page=0').expect(400);
    await agent.get('/api/books?limit=abc').expect(400);
  });

  it('fetches one Book and reports an unknown one as not found', async () => {
    const { agent } = await registerAgent(app, 'Olena');
    const created = await agent.post('/api/books').send(dune).expect(201);

    await agent.get(`/api/books/${created.body.id}`).expect(200);
    await agent
      .get('/api/books/00000000-0000-4000-8000-000000000000')
      .expect(404);
    await agent.get('/api/books/not-a-uuid').expect(400);
  });

  it('lets the Owner remove a Book but not anyone else, except an Admin', async () => {
    const olena = await registerAgent(app, 'Olena');
    const taras = await registerAgent(app, 'Taras');
    const admin = await adminAgent(app);
    const first = await olena.agent.post('/api/books').send(dune).expect(201);
    const second = await olena.agent.post('/api/books').send(dune).expect(201);

    await taras.agent.delete(`/api/books/${first.body.id}`).expect(403);
    await olena.agent.delete(`/api/books/${first.body.id}`).expect(204);
    await admin.delete(`/api/books/${second.body.id}`).expect(204);

    const left = await olena.agent.get('/api/books').expect(200);
    expect(left.body.items).toHaveLength(0);
  });
});
