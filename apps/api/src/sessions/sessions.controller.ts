import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user-id.decorator';

@UseGuards(AuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessions: SessionsService) {}

  @Patch(':id/progress')
  updateProgress(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: UpdateProgressDto,
  ) {
    return this.sessions.updateProgress(userId, id, body);
  }

  @Post()
  create(@UserId() userId: string, @Body() body: CreateSessionDto) {
    return this.sessions.create(userId, body.caseId);
  }

  @Get(':id')
  get(@UserId() userId: string, @Param('id') id: string) {
    return this.sessions.get(userId, id);
  }

  @Get(':id/messages')
  messages(@UserId() userId: string, @Param('id') id: string) {
    return this.sessions.listMessages(userId, id);
  }

  @Post(':id/messages')
  addMessage(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: AddMessageDto,
  ) {
    return this.sessions.addMessage(userId, id, body.role, body.content);
  }

  @Get()
  list(@UserId() userId: string, @Query('caseId') caseId?: string) {
    return this.sessions.list(userId, caseId);
  }

  @Post(':id/complete')
  complete(@UserId() userId: string, @Param('id') id: string) {
    return this.sessions.complete(userId, id);
  }
}
