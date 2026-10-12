import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const PASSWORD_HASH_ROUNDS = 10;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const coverUrl = (slug: string) => `https://picsum.photos/seed/${slug}/400/600`;

const demoUsers = [
  {
    email: 'olena@example.com',
    name: 'Olena Kovalenko',
    books: [
      { name: 'Kobzar', author: 'Taras Shevchenko' },
      { name: 'Forest Song', author: 'Lesya Ukrainka' },
      {
        name: 'Shadows of Forgotten Ancestors',
        author: 'Mykhailo Kotsiubynsky',
      },
      { name: 'The Master and Margarita', author: 'Mikhail Bulgakov' },
    ],
  },
  {
    email: 'andrii@example.com',
    name: 'Andrii Melnyk',
    books: [
      { name: 'Clean Code', author: 'Robert C. Martin' },
      { name: 'The Pragmatic Programmer', author: 'Andrew Hunt' },
      { name: 'Refactoring', author: 'Martin Fowler' },
    ],
  },
  {
    email: 'maria@example.com',
    name: 'Maria Bondar',
    books: [
      { name: 'Dune', author: 'Frank Herbert' },
      { name: 'The Hobbit', author: 'J. R. R. Tolkien' },
      { name: 'Neuromancer', author: 'William Gibson' },
    ],
  },
];

async function seedAdmin() {
  const email = requireEnv('ADMIN_EMAIL');
  const passwordHash = await bcrypt.hash(
    requireEnv('ADMIN_PASSWORD'),
    PASSWORD_HASH_ROUNDS,
  );

  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: { email, name: 'Admin', passwordHash, role: Role.ADMIN },
  });
}

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash(
    requireEnv('DEMO_USER_PASSWORD'),
    PASSWORD_HASH_ROUNDS,
  );

  for (const { books, ...user } of demoUsers) {
    const { id: ownerId } = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });

    if ((await prisma.book.count({ where: { ownerId } })) > 0) continue;

    await prisma.book.createMany({
      data: books.map((book) => ({
        ...book,
        ownerId,
        photoUrl: coverUrl(book.name.toLowerCase().replaceAll(' ', '-')),
      })),
    });
  }
}

try {
  await seedAdmin();
  await seedDemoUsers();
} finally {
  await prisma.$disconnect();
}
