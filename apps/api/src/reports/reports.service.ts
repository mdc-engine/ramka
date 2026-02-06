import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getBySession(sessionId: string) {
    const s = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!s) throw new NotFoundException('Session not found');

    const report = await this.prisma.report.findUnique({
      where: { sessionId },
    });
    if (!report) return { status: 'pending' as const };

    return { status: 'ready' as const, report };
  }
}
