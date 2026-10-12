import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Role } from '../src/generated/prisma/client.js';
import { PasswordResetNotifier } from '../src/auth/password-reset-notifier.js';
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
    expect(me.body).toEqual({ ...registered.body, booksCount: 0 });
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

  it('rejects a password longer than bcrypt can use, counted in bytes', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...olena, password: 'я'.repeat(40) })
      .expect(400);
  });

  it('never returns the password hash from any endpoint', async () => {
    const agent = request.agent(app.getHttpServer());
    const registered = await agent
      .post('/api/auth/register')
      .send(olena)
      .expect(201);
    const login = await agent
      .post('/api/auth/login')
      .send({ email: olena.email.toUpperCase(), password: olena.password })
      .expect(200);
    const me = await agent.get('/api/auth/me').expect(200);

    for (const { body } of [registered, login, me]) {
      expect(JSON.stringify(body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    }
  });

  it('lets a User edit their own Profile and reports how many Books they own', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);
    await agent
      .post('/api/books')
      .send({
        name: 'Kobzar',
        author: 'Taras Shevchenko',
        photoUrl: 'https://example.com/kobzar.png',
      })
      .expect(201);

    const updated = await agent
      .patch('/api/auth/me')
      .send({
        name: 'Olena K.',
        email: 'Olena.K@example.com',
        currentPassword: olena.password,
        avatarUrl: 'https://example.com/olena.png',
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      name: 'Olena K.',
      email: 'olena.k@example.com',
      avatarUrl: 'https://example.com/olena.png',
      role: 'USER',
      booksCount: 1,
    });
    expect((await agent.get('/api/auth/me').expect(200)).body).toEqual(
      updated.body,
    );
  });

  it('does not let a User change their own role or password through the Profile', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);

    await agent.patch('/api/auth/me').send({ role: 'ADMIN' }).expect(400);
    await agent
      .patch('/api/auth/me')
      .send({ password: 'new-password-1' })
      .expect(400);
  });

  it('asks for the current password before changing the Profile email', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);

    await agent
      .patch('/api/auth/me')
      .send({ email: 'thief@example.com' })
      .expect(403);
    await agent
      .patch('/api/auth/me')
      .send({ email: 'thief@example.com', currentPassword: 'wrong-password' })
      .expect(403);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.email).toBe(olena.email);
  });

  it('refuses a Profile email that another User already uses', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...olena, email: 'andrii@example.com', name: 'Andrii' })
      .expect(201);
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);

    await agent
      .patch('/api/auth/me')
      .send({ email: 'andrii@example.com', currentPassword: olena.password })
      .expect(409);
  });

  it('resets a forgotten password through the emailed link and signs out older sessions', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/register').send(olena).expect(201);
    const links: string[] = [];
    vi.spyOn(app.get(PasswordResetNotifier), 'notify').mockImplementation(
      ({ resetLink }) => {
        links.push(resetLink);
      },
    );

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: olena.email })
      .expect(204);
    // The reset is prepared after the response has been sent.
    await vi.waitFor(() => expect(links).toHaveLength(1));
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: new URL(links[0]).searchParams.get('token'),
        password: 'battery-staple',
      })
      .expect(204);

    await agent.get('/api/auth/me').expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: olena.email, password: 'battery-staple' })
      .expect(200);
  });

  it('limits how many reset links one email can request', async () => {
    const send = () =>
      request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'flooded@example.com' });

    for (let attempt = 0; attempt < 3; attempt++) await send().expect(204);

    await send().expect(429);
  });

  it('answers a password reset request for an unknown email like a known one', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(204);
  });

  it('refuses to reset a password with an invalid link or a weak password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'battery-staple' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'short' })
      .expect(400);
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
    expect(me.body).toEqual({ ...login.body, booksCount: 0 });
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

    it('stops an Admin from demoting themselves', async () => {
      const agent = await loginAsAdmin();
      const me = await agent.get('/api/auth/me').expect(200);

      await agent
        .patch(`/api/users/${me.body.id}`)
        .send({ role: 'USER' })
        .expect(403);
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
