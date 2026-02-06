import { apiGetServer } from '@/lib/api.server';
import Link from 'next/link';
import { StartSessionButton } from './StartSessionButton';
import { formatDateTimeISOish } from '@/lib/datetime';

type CaseFull = {
	id: string;
	title: string;
	tags: string[];
	difficulty: number;
	method: string;
	payload: unknown;
};

type SessionListItem = {
	id: string;
	caseId: string;
	number: number;
	status: 'active' | 'completed';
	startedAt: string;
	endedAt: string | null;

	currentStageId: string | null;
	completedStageIds: string[];
};

type Stage = { id: string; title: string };

function isRecord(x: unknown): x is Record<string, unknown> {
	return typeof x === 'object' && x !== null;
}

function asString(x: unknown): string | null {
	return typeof x === 'string' && x.length > 0 ? x : null;
}

function extractStages(payload: unknown): Stage[] {
	if (!isRecord(payload)) return [];
	const arc = payload['arc'];
	if (!isRecord(arc)) return [];
	const stages = arc['stages'];
	if (!Array.isArray(stages)) return [];
	const out: Stage[] = [];
	for (const it of stages) {
		if (!isRecord(it)) continue;
		const id = asString(it['id']);
		const title = asString(it['title']) ?? id;
		if (!id || !title) continue;
		out.push({ id, title });
	}
	return out;
}

async function getCase(id: string): Promise<CaseFull> {
	return apiGetServer<CaseFull>(`/cases/${id}`, { cache: 'no-store' });
}

async function getSessionsByCase(caseId: string): Promise<SessionListItem[]> {
	return apiGetServer<SessionListItem[]>(
		`/sessions?caseId=${encodeURIComponent(caseId)}`,
		{ cache: 'no-store' },
	);
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const c = await getCase(id);

	const stages = extractStages(c.payload);
	const stageTitleById = new Map(stages.map((s) => [s.id, s.title]));

	// ✅ ДОБАВИТЬ: грузим сессии
	const sessions = await getSessionsByCase(c.id);

	const latest = sessions[0] ?? null;
	const active = sessions.find((x) => x.status === 'active') ?? null;
	const lastCompleted = sessions.find((x) => x.status === 'completed') ?? null;

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<Link href="/" style={{ textDecoration: 'none' }}>
				← Назад
			</Link>

			<h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 700 }}>
				{c.title}
			</h1>
			<div style={{ marginTop: 6, opacity: 0.75 }}>
				{c.method} · сложность {c.difficulty} · {c.id}
			</div>

			<div
				style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}
			>
				<StartSessionButton caseId={c.id} />

				{active && (
					<Link
						href={`/sessions/${active.id}`}
						style={{ textDecoration: 'none' }}
					>
						Открыть активную →
					</Link>
				)}

				{lastCompleted && (
					<Link
						href={`/sessions/${lastCompleted.id}/report`}
						style={{ textDecoration: 'none' }}
					>
						Последний отчёт →
					</Link>
				)}
			</div>

			{/* ✅ ДОБАВИТЬ: вывод списка сессий */}
			<h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 600 }}>Сессии</h2>

			{latest && (
				<div
					style={{
						marginTop: 16,
						padding: 12,
						border: '1px solid #e5e7eb',
						borderRadius: 12,
					}}
				>
					<div style={{ fontWeight: 600 }}>Прогресс кейса</div>
					<div style={{ opacity: 0.8, marginTop: 6 }}>
						Текущий этап:{' '}
						{latest.currentStageId
							? (stageTitleById.get(latest.currentStageId) ??
								latest.currentStageId)
							: '-'}
						{' · '}
						Завершено этапов: {latest.completedStageIds?.length ?? 0}
					</div>
				</div>
			)}

			{sessions.length === 0 ? (
				<div style={{ opacity: 0.75, marginTop: 8 }}>Сессий пока нет.</div>
			) : (
				<div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
					{sessions.map((s) => {
						const href =
							s.status === 'completed'
								? `/sessions/${s.id}/report`
								: `/sessions/${s.id}`;

						return (
							<Link
								key={s.id}
								href={href}
								style={{
									display: 'block',
									border: '1px solid #e5e7eb',
									borderRadius: 12,
									padding: 12,
									textDecoration: 'none',
								}}
							>
								<div style={{ fontWeight: 600 }}>
									Сессия #{s.number} ·{' '}
									{s.status === 'completed' ? 'завершена' : 'активная'}
								</div>
								<div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>
									Этап:{' '}
									{s.currentStageId
										? (stageTitleById.get(s.currentStageId) ?? s.currentStageId)
										: '-'}
									{' · '}
									Завершено: {s.completedStageIds?.length ?? 0}
								</div>
								<div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>
									{formatDateTimeISOish(s.startedAt)}
								</div>
							</Link>
						);
					})}
				</div>
			)}

			<h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 600 }}>
				Payload (временно)
			</h2>
			<pre
				style={{
					marginTop: 12,
					padding: 12,
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					overflow: 'auto',
				}}
			>
				{JSON.stringify(c.payload, null, 2)}
			</pre>
		</main>
	);
}
