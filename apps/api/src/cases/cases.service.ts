import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.case.findMany({
      select: {
        id: true,
        title: true,
        tags: true,
        difficulty: true,
        method: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async get(id: string) {
    const c = await this.prisma.case.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }
}
