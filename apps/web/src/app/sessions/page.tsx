import Link from 'next/link';
import { apiGetServer } from '@/lib/api.server';
import { formatDateTimeISOish } from '@/lib/datetime';

type SessionStatus = 'active' | 'completed';

type SessionListItem = {
	id: string;
	caseId: string;
	number: number;
	status: SessionStatus;
	startedAt: string;
	endedAt: string | null;
	currentStageId: string | null;
	completedStageIds: string[];
	case: { id: string; title: string; method: string; difficulty: number };
	report: { createdAt: string } | null;
};

async function getSessions(): Promise<SessionListItem[]> {
	return apiGetServer<SessionListItem[]>('/sessions', { cache: 'no-store' });
}

function isStatus(x: unknown): x is SessionStatus {
	return x === 'active' || x === 'completed';
}

function FilterLink({
	href,
	active,
	children,
}: {
	href: string;
	active: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			style={{
				textDecoration: 'none',
				border: '1px solid #e5e7eb',
				borderRadius: 999,
				padding: '6px 10px',
				fontSize: 12,
				opacity: active ? 1 : 0.75,
				fontWeight: active ? 700 : 500,
			}}
		>
			{children}
		</Link>
	);
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const sp = await searchParams;
	const statusRaw = sp.status;
	const statusStr = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;
	const status: SessionStatus | null = isStatus(statusStr) ? statusStr : null;

	const sessions = await getSessions();
	const filtered = status
		? sessions.filter((s) => s.status === status)
		: sessions;

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<div
				style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
			>
				<h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Сессии</h1>

				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<FilterLink href="/sessions" active={!status}>
						Все
					</FilterLink>
					<FilterLink
						href="/sessions?status=active"
						active={status === 'active'}
					>
						Активные
					</FilterLink>
					<FilterLink
						href="/sessions?status=completed"
						active={status === 'completed'}
					>
						Завершённые
					</FilterLink>
				</div>
			</div>

			<div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
				Показано: {filtered.length} из {sessions.length}
			</div>

			{filtered.length === 0 ? (
				<div style={{ opacity: 0.75, marginTop: 10 }}>Сессий нет.</div>
			) : (
				<div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
					{filtered.map((s) => {
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
								<div
									style={{ display: 'flex', justifyContent: 'space-between' }}
								>
									<div style={{ fontWeight: 700 }}>
										{s.case.title} — сессия #{s.number}
									</div>
									<div style={{ fontSize: 12, opacity: 0.75 }}>
										{s.status === 'completed' ? 'завершена' : 'активная'}
									</div>
								</div>

								<div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>
									{s.case.method} · сложность {s.case.difficulty} · {s.caseId}
								</div>

								<div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
									Начало: {formatDateTimeISOish(s.startedAt)}
									{s.endedAt
										? ` · Конец: ${formatDateTimeISOish(s.endedAt)}`
										: ''}
								</div>

								<div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
									Этап: {s.currentStageId ?? '-'} · Завершено этапов:{' '}
									{s.completedStageIds?.length ?? 0}
									{s.report
										? ` · Отчёт: ${formatDateTimeISOish(s.report.createdAt)}`
										: ''}
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</main>
	);
}
