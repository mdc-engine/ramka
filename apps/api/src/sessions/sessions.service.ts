import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';

function extractStageIdsFromPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;

  const arc = p['arc'];
  if (!arc || typeof arc !== 'object') return [];
  const a = arc as Record<string, unknown>;

  const stages = a['stages'];
  if (!Array.isArray(stages)) return [];

  const ids: string[] = [];
  for (const it of stages) {
    if (!it || typeof it !== 'object') continue;
    const r = it as Record<string, unknown>;
    const id = r['id'];
    if (typeof id === 'string' && id.length > 0) ids.push(id);
  }
  return ids;
}

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reports') private reportsQueue: Queue,
  ) {}

  private async assertSessionOwnedByUserId(userId: string, sessionId: string) {
    const s = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });

    if (!s) throw new NotFoundException('Session not found');
    if (s.userId !== userId) throw new ForbiddenException('Not your session');
  }

  async create(userId: string, caseId: string) {
    if (!caseId?.trim()) throw new BadRequestException('caseId is required');

    const c = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException('Case not found');

    // 1) если уже есть активная сессия по этому кейсу — возвращаем её
    const active = await this.prisma.session.findFirst({
      where: { userId, caseId, status: 'active' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        caseId: true,
        number: true,
        status: true,
        startedAt: true,
      },
    });

    if (active) return active;

    // 2) иначе создаём новую
    const last = await this.prisma.session.findFirst({
      where: { userId, caseId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const nextNumber = (last?.number ?? 0) + 1;

    const caseStateBefore: Prisma.InputJsonValue =
      c.payload === null
        ? ({} as Prisma.InputJsonValue)
        : (c.payload as Prisma.InputJsonValue);

    function isRecord(x: unknown): x is Record<string, unknown> {
      return typeof x === 'object' && x !== null;
    }
    function asString(x: unknown): string | null {
      return typeof x === 'string' && x.length > 0 ? x : null;
    }
    function pickInitialStageId(payload: unknown): string | null {
      if (!isRecord(payload)) return null;
      const arc = payload['arc'];
      if (!isRecord(arc)) return null;

      const explicit = asString(arc['current_stage_id']);
      if (explicit) return explicit;

      const stages = arc['stages'];
      if (!Array.isArray(stages) || stages.length === 0) return null;
      const first = stages[0];
      if (!isRecord(first)) return null;

      return asString(first['id']);
    }

    const initialStageId = pickInitialStageId(c.payload);

    return this.prisma.session.create({
      data: {
        userId,
        caseId,
        number: nextNumber,
        status: 'active',
        caseStateBefore,
        currentStageId: initialStageId,
        completedStageIds: [],
      },
      select: {
        id: true,
        caseId: true,
        number: true,
        status: true,
        startedAt: true,
      },
    });
  }

  async get(userId: string, sessionId: string) {
    await this.assertSessionOwnedByUserId(userId, sessionId);

    const s = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            method: true,
            tags: true,
            payload: true,
          },
        },
      },
    });

    if (!s) throw new NotFoundException('Session not found');
    return s;
  }

  async listMessages(userId: string, sessionId: string) {
    await this.assertSessionOwnedByUserId(userId, sessionId);

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
  }

  async updateProgress(
    userId: string,
    sessionId: string,
    dto: { currentStageId?: string; completeStageId?: string },
  ) {
    await this.assertSessionOwnedByUserId(userId, sessionId);

    if (!dto.currentStageId && !dto.completeStageId) {
      throw new BadRequestException('Nothing to update');
    }

    // берём сессию + связанный кейс (чтобы прочитать stages)
    const s = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        currentStageId: true,
        completedStageIds: true,
        case: { select: { payload: true } },
      },
    });
    if (!s) throw new NotFoundException('Session not found');

    const completed = new Set<string>(s.completedStageIds ?? []);

    let newCurrent: string | null | undefined = undefined;

    if (dto.completeStageId) {
      completed.add(dto.completeStageId);

      if (s.currentStageId === dto.completeStageId) {
        const stages = extractStageIdsFromPayload(s.case.payload);
        const idx = stages.indexOf(dto.completeStageId);
        newCurrent =
          idx >= 0 && idx + 1 < stages.length ? stages[idx + 1] : null;
      }
    }

    if (dto.currentStageId !== undefined) newCurrent = dto.currentStageId;

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(newCurrent !== undefined ? { currentStageId: newCurrent } : {}),
        completedStageIds: Array.from(completed),
      },
      select: { id: true, currentStageId: true, completedStageIds: true },
    });
  }

  async addMessage(
    userId: string,
    sessionId: string,
    role: string,
    content: string,
  ) {
    await this.assertSessionOwnedByUserId(userId, sessionId);

    if (!content?.trim()) throw new BadRequestException('content is required');

    const validRoles = new Set(['therapist', 'client', 'system']);
    if (!validRoles.has(role))
      throw new BadRequestException('role must be therapist|client|system');

    const created = await this.prisma.message.create({
      data: { sessionId, role, content },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    // оставляем текущую заглушку "ответа клиента"
    if (role === 'therapist') {
      await this.prisma.message.create({
        data: {
          sessionId,
          role: 'client',
          content:
            'Понял. Расскажи, пожалуйста, подробнее: когда это происходит чаще всего?',
        },
      });
    }

    return created;
  }

  async list(userId: string, caseId?: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        ...(caseId ? { caseId } : {}),
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        caseId: true,
        number: true,
        status: true,
        startedAt: true,
        endedAt: true,
        currentStageId: true,
        completedStageIds: true,
        case: {
          select: { id: true, title: true, method: true, difficulty: true },
        },
        report: { select: { createdAt: true } },
      },
    });
  }

  async complete(userId: string, sessionId: string) {
    await this.assertSessionOwnedByUserId(userId, sessionId);

    const s = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        status: true,
        caseStateBefore: true,
        currentStageId: true,
        completedStageIds: true,
      },
    });

    if (!s) throw new NotFoundException('Session not found');
    if (s.status === 'completed') return { ok: true };

    const beforeObj =
      s.caseStateBefore &&
      typeof s.caseStateBefore === 'object' &&
      s.caseStateBefore !== null
        ? (s.caseStateBefore as Record<string, unknown>)
        : {};

    const caseStateAfter: Prisma.InputJsonValue = {
      ...beforeObj,
      progress: {
        currentStageId: s.currentStageId,
        completedStageIds: s.completedStageIds ?? [],
      },
    } as Prisma.InputJsonValue;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        caseStateAfter,
      },
    });

    await this.reportsQueue.add(
      'generate',
      { sessionId },
      { removeOnComplete: true, removeOnFail: 50 },
    );

    return { ok: true };
  }
}
