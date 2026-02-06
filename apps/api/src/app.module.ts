import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CasesModule } from './cases/cases.module';
import { SessionsModule } from './sessions/sessions.module';
import { QueuesModule } from './queues/queues.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    CasesModule,
    SessionsModule,
    QueuesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
