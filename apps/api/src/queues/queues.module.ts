import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
