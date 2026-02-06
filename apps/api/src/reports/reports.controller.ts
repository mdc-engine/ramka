import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('sessions')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get(':id/report')
  getReport(@Param('id') id: string) {
    return this.reports.getBySession(id);
  }
}
