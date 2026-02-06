import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import * as fs from 'node:fs';
import * as path from 'node:path';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type CasePayload = {
  case_id: string;
  title?: string;
  method?: string;
  difficulty?: number;
  tags?: string[];
  [k: string]: unknown;
};

function isCasePayload(x: unknown): x is CasePayload {
  if (typeof x !== 'object' || x === null) return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.case_id === 'string' && obj.case_id.length > 0;
}

function parseJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as unknown;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const casesDir = path.join(repoRoot, 'data', 'cases');

  const files = fs.readdirSync(casesDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const fullPath = path.join(casesDir, file);
    const parsed = parseJsonFile(fullPath);

    if (!isCasePayload(parsed)) {
      throw new Error(
        `Invalid case payload in ${file}: missing/invalid case_id`,
      );
    }

    const payload = parsed; // CasePayload (для чтения полей)
    const payloadJson = parsed as Prisma.InputJsonValue; // для Prisma Json

    const id = payload.case_id;
    const title = typeof payload.title === 'string' ? payload.title : id;
    const method = typeof payload.method === 'string' ? payload.method : 'CBT';
    const difficulty =
      typeof payload.difficulty === 'number' ? payload.difficulty : 1;
    const tags = Array.isArray(payload.tags)
      ? payload.tags.filter((t): t is string => typeof t === 'string')
      : [];

    await prisma.case.upsert({
      where: { id },
      create: { id, title, method, difficulty, tags, payload: payloadJson },
      update: { title, method, difficulty, tags, payload: payloadJson },
    });
  }

  console.log(`Seeded ${files.length} case(s).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    await prisma.$disconnect();
    process.exit(1);
  });
