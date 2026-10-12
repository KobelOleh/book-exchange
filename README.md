# testInsiders

Full-stack: **Next.js** + **NestJS** + **PostgreSQL** (Prisma).

```
backend/    NestJS API (Prisma, Swagger)
frontend/   Next.js (App Router) + React Query
docker-compose.yml   PostgreSQL
```

## Requirements

Node 24, Docker Desktop.

## Run

```bash
# 1. database
docker compose up -d

# 2. backend  (http://localhost:3000, Swagger: /docs)
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed   # admin + demo users
npm run start:dev

# 3. frontend (http://localhost:3100)
cd frontend
npm install
npm run dev
```

The frontend proxies `/api` to the backend through a Next rewrite
(`frontend/next.config.ts`, target set by `BACKEND_URL`, default
`http://localhost:4000`), so the HttpOnly auth cookie stays same-origin.
`frontend/proxy.ts` redirects visitors without the cookie to `/login`; the
backend still verifies the token on every call. Port 3100 is used because
Windows can reserve 3000 (check `netsh int ipv4 show excludedportrange protocol=tcp`).

Pages: `/login`, `/register`, `/` (browse, search, request an exchange),
`/my-books`, `/exchanges`, `/admin/users` (Admin only).

## Useful commands

| Where   | Command                                | What                                               |
| ------- | -------------------------------------- | -------------------------------------------------- |
| backend | `npm test`                             | unit tests                                         |
| backend | `npm run lint`                         | oxlint                                             |
| backend | `npx prisma migrate dev --name <name>` | new migration after editing `prisma/schema.prisma` |
| backend | `npx prisma studio`                    | DB browser                                         |
| root    | `docker compose down -v`               | stop DB and wipe data                              |

## API

`GET /api/health`, `GET|POST /api/tasks`, `GET|PATCH|DELETE /api/tasks/:id`.

// Відповіді від замовника

1. Для фото використовувати URL
2. Для email лог в консоль для демо
3. Створення адміна як зручно, можна і через seed скрипт
4. Список книг для обміну означає вибрані відправником книги
5. Зберігати запити на обмін у БД
