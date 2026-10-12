import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Role } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';
import { resetDatabase } from './support/test-module.js';

describe('Authentication and roles (HTTP)', () => {
  let app: INestApplication;

  const olena = {
    email: 'olena@example.com',
    name: 'Olena',
    password: 'correct-horse',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a User and recognises them on the next request through the cookie', async () => {
    const agent = request.agent(app.getHttpServer());

    const registered = await agent
      .post('/api/auth/register')
      .send(olena)
      .expect(201);
    const me = await agent.get('/api/auth/me').expect(200);

    expect(registered.body).toMatchObject({
      email: olena.email,
      role: 'USER',
    });
    expect(registered.body).not.toHaveProperty('passwordHash');
    expect(me.body).toEqual(registered.body);
  });

  it('keeps the access token out of reach of page scripts', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(olena)
      .expect(201);

    expect(response.headers['set-cookie']?.[0]).toMatch(/HttpOnly/i);
  });

  it('turns away a request that carries no access token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('does not let a visitor choose their own role while registering', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...olena, role: 'ADMIN' })
      .expect(400);
  });

  it('logs a registered User in with the right credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(olena)
      .expect(201);
    const agent = request.agent(app.getHttpServer());

    const login = await agent
      .post('/api/auth/login')
      .send({ email: olena.email, password: olena.password })
      .expect(200);
    const me = await agent.get('/api/auth/me').expect(200);

    expect(login.body).toMatchObject({ email: olena.email });
    expect(me.body).toEqual(login.body);
  });

  it('refuses to log in with a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(olena)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: olena.email, password: 'wrong-password' })
      .expect(401);
  });

  describe('managing Users', () => {
    const admin = {
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
    };

    async function loginAsAdmin() {
      await app.get(UsersService).create({ ...admin, role: Role.ADMIN });
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/auth/login')
        .send({ email: admin.email, password: admin.password })
        .expect(200);
      return agent;
    }

    it('keeps the User list away from a regular User', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/register').send(olena).expect(201);

      await agent.get('/api/users').expect(403);
    });

    it('lets an Admin list Users', async () => {
      const agent = await loginAsAdmin();

      const response = await agent.get('/api/users').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ email: admin.email });
    });

    it('lets an Admin create a User with a chosen role', async () => {
      const agent = await loginAsAdmin();

      const response = await agent
        .post('/api/users')
        .send({ ...olena, role: 'ADMIN' })
        .expect(201);

      expect(response.body).toMatchObject({
        email: olena.email,
        role: 'ADMIN',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('lets an Admin update and remove another User', async () => {
      const agent = await loginAsAdmin();
      const created = await agent.post('/api/users').send(olena).expect(201);

      const updated = await agent
        .patch(`/api/users/${created.body.id}`)
        .send({ name: 'Olena K.' })
        .expect(200);
      await agent.delete(`/api/users/${created.body.id}`).expect(204);

      expect(updated.body).toMatchObject({ name: 'Olena K.' });
      await agent.get('/api/users').expect(200);
    });

    it('stops an Admin from removing themselves', async () => {
      const agent = await loginAsAdmin();
      const me = await agent.get('/api/auth/me').expect(200);

      await agent.delete(`/api/users/${me.body.id}`).expect(403);
    });
  });

  it('forgets the User after logging out', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);

    await agent.post('/api/auth/logout').expect(204);

    await agent.get('/api/auth/me').expect(401);
  });
});
