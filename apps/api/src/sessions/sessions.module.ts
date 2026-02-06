import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: 'reports' })],
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService],
})
export class SessionsModule {}
