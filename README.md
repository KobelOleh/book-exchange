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

# 2. backend  (http://localhost:4000, Swagger: /docs)
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
| backend | `npm run test:e2e`                     | HTTP tests                                         |
| backend | `npm run lint`                         | oxlint                                             |
| backend | `npx prisma migrate dev --name <name>` | new migration after editing `prisma/schema.prisma` |
| backend | `npx prisma studio`                    | DB browser                                         |
| root    | `docker compose down -v`               | stop DB and wipe data                              |

## API

All routes except `/api/health`, `/api/auth/register` and `/api/auth/login` require the auth cookie.

| Route                                                              | What                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me` | authentication                                                                     |
| `GET /api/books?search=&mine=true`, `GET /api/books/:id`           | browse and search Books                                                            |
| `POST /api/books`, `DELETE /api/books/:id`                         | add a Book; remove own Book (Admin: any)                                           |
| `POST /api/exchange-requests`                                      | `{ requestedBookId, offeredBookIds[] }`; the Owner is notified (logged to console) |
| `GET /api/exchange-requests/sent`, `/received`                     | the caller's ExchangeRequests                                                      |
| `/api/users` (Admin only)                                          | list, create, update, delete Users                                                 |

The first Admin comes from the seed: set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`, then run `npx prisma db seed`.

// Відповіді від замовника

1. Для фото використовувати URL
2. Для email лог в консоль для демо
3. Створення адміна як зручно, можна і через seed скрипт
4. Список книг для обміну означає вибрані відправником книги
5. Зберігати запити на обмін у БД

## Security notes

- Auth is an HttpOnly, `SameSite=Lax` cookie (`Secure` when `NODE_ENV=production`) holding an HS256 JWT. `JWT_SECRET` must be at least 32 characters. The role is re-read from the database on every request, so role changes and removals apply immediately.
- Logout clears the cookie but tokens are stateless: a copied token stays valid until `JWT_EXPIRES_IN` passes. Keep that short if it matters.
- Login is limited per account (`AUTH_RATE_LIMIT` attempts per minute, default 10), not per IP, because the Next proxy does not provide a trustworthy client address. The trade-off: someone can briefly lock a known email out of logging in.
- Emails are case-insensitive (stored lowercased). Passwords are bcrypt-hashed; the hash never leaves the service.
- Swagger (`/docs`) is disabled when `NODE_ENV=production`. No CORS is enabled: the browser only talks to the Next origin, which proxies `/api`.
- `backend/.env` is git-ignored; only `.env.example` files are committed. The Postgres port is bound to `127.0.0.1` for local development only.
- The seed resets the password of an existing account when it promotes `ADMIN_EMAIL` to Admin.

## Known limitations

- **Deleting an offered book.** If a book that is part of an existing exchange
  request's offer is later deleted, the request simply loses that book and may
  end up with an empty offer. The specification does not define this case, so
  it is left as is. A production version would either block deleting such a book
  or cancel the affected requests.
  -eting such a book
  The owner notification is printed to the console instead of
  being sent by email, as the task allows.
