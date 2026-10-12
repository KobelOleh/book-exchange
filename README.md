# testInsiders

Full-stack: **React (Vite)** + **NestJS** + **PostgreSQL** (Prisma).

```
backend/    NestJS API (Prisma, Swagger)
frontend/   React + Vite + React Query
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
npm run start:dev

# 3. frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

The frontend proxies `/api` to the backend (see `frontend/vite.config.ts`).

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
