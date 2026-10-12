import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../src/prisma/prisma.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

/** Builds a Nest testing module wired to the real test database. */
export async function createTestModule(
  imports: ModuleMetadata['imports'],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PrismaModule,
      ...imports!,
    ],
  }).compile();
}

/** Empties every table so each test starts from a clean database. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ExchangeRequest", "Book", "User" RESTART IDENTITY CASCADE',
  );
}
