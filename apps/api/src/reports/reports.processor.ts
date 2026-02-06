import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';

@Processor('reports')
export class ReportsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  // job.data: { sessionId: string }
  async process(job: Job<{ sessionId: string }>) {
    const { sessionId } = job.data;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        case: { select: { title: true, method: true, payload: true } }, // ✅ payload
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, createdAt: true },
        },
      },
    });
    if (!session) throw new Error('Session not found');

    function isRecord(x: unknown): x is Record<string, unknown> {
      return typeof x === 'object' && x !== null;
    }
    function asString(x: unknown): string | null {
      return typeof x === 'string' && x.length > 0 ? x : null;
    }
    function extractStageTitleById(payload: unknown): Map<string, string> {
      const map = new Map<string, string>();
      if (!isRecord(payload)) return map;
      const arc = payload['arc'];
      if (!isRecord(arc)) return map;
      const stages = arc['stages'];
      if (!Array.isArray(stages)) return map;

      for (const it of stages) {
        if (!isRecord(it)) continue;
        const id = asString(it['id']);
        const title = asString(it['title']) ?? id;
        if (!id || !title) continue;
        map.set(id, title);
      }
      return map;
    }

    // Простая “заглушка” отчёта без AI: считаем метрики и формируем структуру
    const therapistMsgs = session.messages.filter(
      (m) => m.role === 'therapist',
    );
    const clientMsgs = session.messages.filter((m) => m.role === 'client');
    const totalTurns = session.messages.length;

    const stageTitleById = extractStageTitleById(session.case.payload);
    const completedIds = session.completedStageIds ?? [];

    const progress = {
      currentStageId: session.currentStageId ?? null,
      currentStageTitle: session.currentStageId
        ? (stageTitleById.get(session.currentStageId) ?? session.currentStageId)
        : null,
      completedStageIds: completedIds,
      completedStageTitles: completedIds.map(
        (id) => stageTitleById.get(id) ?? id,
      ),
      totalStages: stageTitleById.size,
    };

    const payload = {
      sessionId,
      caseTitle: session.case.title,
      method: session.case.method,
      progress,
      stats: {
        totalMessages: totalTurns,
        therapistMessages: therapistMsgs.length,
        clientMessages: clientMsgs.length,
      },
      notes: {
        strengths: [
          therapistMsgs.length > 0
            ? 'Терапевт активно ведёт диалог'
            : 'Нет сообщений терапевта',
        ],
        risks: [totalTurns < 6 ? 'Сессия очень короткая — мало данных' : '—'],
      },
      transcriptPreview: session.messages
        .slice(0, 6)
        .map((m) => ({ role: m.role, content: m.content })),
      createdAt: new Date().toISOString(),
    };

    const summary = `Отчёт (заглушка). Сообщений: ${totalTurns}, терапевт: ${therapistMsgs.length}, клиент: ${clientMsgs.length}.`;

    const scores = {
      structure: therapistMsgs.length >= 3 ? 3 : 2,
      engagement: clientMsgs.length >= 2 ? 3 : 2,
      clarity: 3,
    };

    await this.prisma.report.upsert({
      where: { sessionId },
      create: {
        sessionId,
        summary,
        scores,
        payload,
      },
      update: {
        summary,
        scores,
        payload,
      },
    });
  }
}
