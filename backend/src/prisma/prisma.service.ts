import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // In early development we may not have Postgres configured yet.
      // The API will fail when it actually tries to query, but the server can still boot.
      // eslint-disable-next-line no-console
      console.warn('Prisma DB connection failed on startup:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

