import Link from 'next/link';
import { Chat } from './chat';
import { CompleteSessionButton } from './CompleteSessionButton';
import { apiGetServer } from '@/lib/api.server';
import { SessionProgressPanel } from './SessionProgressPanel';

type SessionDto = {
	id: string;
	caseId: string;
	number: number;
	status: 'active' | 'completed';
	startedAt: string;
	endedAt: string | null;

	currentStageId: string | null;
	completedStageIds: string[] | null;

	case: {
		id: string;
		title: string;
		difficulty: number;
		method: string;
		tags: string[];
		payload: unknown;
	};
};

async function getSession(id: string): Promise<SessionDto> {
	return apiGetServer<SessionDto>(`/sessions/${id}`, { cache: 'no-store' });
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const s = await getSession(id);

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<Link href="/" style={{ textDecoration: 'none' }}>
				← К каталогу
			</Link>

			<h1 style={{ marginTop: 12, fontSize: 22, fontWeight: 700 }}>
				{s.case.title} — сессия #{s.number}
			</h1>
			<div style={{ opacity: 0.75, marginTop: 4 }}>
				{s.case.method} · сложность {s.case.difficulty}
			</div>

			{s.status !== 'completed' && (
				<div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
					<CompleteSessionButton sessionId={id} />
				</div>
			)}

			<SessionProgressPanel
				sessionId={id}
				payload={s.case.payload}
				currentStageId={s.currentStageId}
				completedStageIds={s.completedStageIds ?? []}
				disabled={s.status === 'completed'}
			/>

			<div style={{ marginTop: 16 }}>
				<Chat sessionId={id} />
			</div>
		</main>
	);
}
