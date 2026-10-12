import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp } from './support/http.js';
import { resetDatabase } from './support/test-module.js';

describe('Login rate limit (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH_RATE_LIMIT = '3';
    app = await createApp();
  });

  beforeEach(async () => {
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 429 once a client keeps guessing passwords', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'olena@example.com', password: 'wrong-password' });

    await attempt().expect(401);
    await attempt().expect(401);
    await attempt().expect(401);
    await attempt().expect(429);
  });

  it('cannot be evaded by spoofing the forwarded address', async () => {
    const attempt = (ip: string) =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'Victim@example.com', password: 'wrong-password' });

    await attempt('1.1.1.1').expect(401);
    await attempt('2.2.2.2').expect(401);
    await attempt('3.3.3.3').expect(401);
    await attempt('4.4.4.4').expect(429);
  });

  it('counts each account separately', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `user${i}@example.com`, password: 'wrong-password' })
        .expect(401);
    }
  });

  it('does not throttle other routes', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    }
  });
});
