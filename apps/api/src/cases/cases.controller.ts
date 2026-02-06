import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('cases')
export class CasesController {
  constructor(private cases: CasesService) {}

  @Get()
  list() {
    return this.cases.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cases.get(id);
  }
}
