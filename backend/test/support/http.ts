import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { Role } from '../../src/generated/prisma/client.js';
import { UsersService } from '../../src/users/users.service.js';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

/** Registers a User through the API and returns an agent holding their cookie. */
export async function registerAgent(
  app: INestApplication,
  name: string,
): Promise<{ agent: ReturnType<typeof request.agent>; id: string }> {
  const agent = request.agent(app.getHttpServer());
  const { body } = await agent
    .post('/api/auth/register')
    .send({
      email: `${name.toLowerCase()}@example.com`,
      name,
      password: 'correct-horse',
    })
    .expect(201);
  return { agent, id: body.id };
}

/** Creates an Admin directly and returns a logged-in agent. */
export async function adminAgent(
  app: INestApplication,
): Promise<ReturnType<typeof request.agent>> {
  const credentials = {
    email: 'admin@example.com',
    password: 'admin-pass-123',
  };
  await app
    .get(UsersService)
    .create({ ...credentials, name: 'Admin', role: Role.ADMIN });
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/auth/login').send(credentials).expect(200);
  return agent;
}
