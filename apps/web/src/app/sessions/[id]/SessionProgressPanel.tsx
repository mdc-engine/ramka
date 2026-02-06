'use client';

import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Stage = { id: string; title: string; goal?: string };

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

	const result: Stage[] = [];

	for (const item of stages) {
		if (!isRecord(item)) continue;

		const id = asString(item['id']);
		const title = asString(item['title']) ?? asString(item['name']) ?? id;

		if (!id || !title) continue;

		const goal = asString(item['goal']) ?? undefined;

		result.push({ id, title, goal });
	}

	return result;
}

export function SessionProgressPanel({
	sessionId,
	payload,
	currentStageId,
	completedStageIds,
	disabled,
}: {
	sessionId: string;
	payload: unknown;
	currentStageId: string | null;
	completedStageIds: string[];
	disabled?: boolean;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);

	const stages = useMemo(() => extractStages(payload), [payload]);

	const currentIdx = stages.findIndex((s) => s.id === currentStageId);

	// если текущий не задан или не найден — "следующий" = первый
	const nextStage =
		currentStageId === null || currentIdx < 0
			? (stages[0] ?? null)
			: currentIdx + 1 < stages.length
				? stages[currentIdx + 1]
				: null;

	const completedSet = useMemo(
		() => new Set(completedStageIds ?? []),
		[completedStageIds],
	);

	async function patch(body: Record<string, unknown>, key: string) {
		setLoading(key);
		try {
			await apiFetch(`/sessions/${sessionId}/progress`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			router.refresh();
		} finally {
			setLoading(null);
		}
	}

	if (stages.length === 0) {
		return (
			<div
				style={{
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					padding: 12,
					marginTop: 16,
				}}
			>
				<div style={{ fontWeight: 600 }}>Прогресс</div>
				<div style={{ opacity: 0.75, marginTop: 6 }}>
					В payload нет stages (ожидаем payload.arc.stages[]).
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				border: '1px solid #e5e7eb',
				borderRadius: 12,
				padding: 12,
				marginTop: 16,
			}}
		>
			<div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
				<button
					disabled={disabled || loading !== null || !nextStage}
					onClick={() => patch({ currentStageId: nextStage!.id }, 'next')}
					style={{
						borderRadius: 12,
						padding: '8px 10px',
						border: '1px solid #e5e7eb',
						cursor:
							disabled || loading !== null || !nextStage
								? 'not-allowed'
								: 'pointer',
					}}
				>
					{loading === 'next'
						? '...'
						: nextStage
							? `Следующий этап: ${nextStage.title}`
							: 'Следующий этап'}
				</button>
			</div>

			<div style={{ fontWeight: 600 }}>Прогресс по этапам</div>

			<div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
				{stages.map((s) => {
					const isCurrent = currentStageId === s.id;
					const isCompleted = completedSet.has(s.id);

					return (
						<div
							key={s.id}
							style={{
								border: '1px solid #e5e7eb',
								borderRadius: 12,
								padding: 10,
								opacity: disabled ? 0.6 : 1,
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									gap: 10,
								}}
							>
								<div>
									<div style={{ fontWeight: 600 }}>
										{s.title} {isCompleted ? '✓' : ''}{' '}
										{isCurrent ? '• текущий' : ''}
									</div>
									<div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
										{s.id}
									</div>
									{s.goal && (
										<div style={{ marginTop: 6, opacity: 0.85 }}>{s.goal}</div>
									)}
								</div>
							</div>

							<div
								style={{
									display: 'flex',
									gap: 8,
									marginTop: 10,
									flexWrap: 'wrap',
								}}
							>
								<button
									disabled={disabled || loading !== null || isCurrent}
									onClick={() => patch({ currentStageId: s.id }, `cur:${s.id}`)}
									style={{
										borderRadius: 12,
										padding: '8px 10px',
										border: '1px solid #e5e7eb',
										cursor:
											disabled || loading !== null || isCurrent
												? 'not-allowed'
												: 'pointer',
									}}
								>
									{loading === `cur:${s.id}`
										? '...'
										: isCurrent
											? 'Текущий'
											: 'Сделать текущим'}
								</button>

								<button
									disabled={disabled || loading !== null || isCompleted}
									onClick={() =>
										patch({ completeStageId: s.id }, `done:${s.id}`)
									}
									style={{
										borderRadius: 12,
										padding: '8px 10px',
										border: '1px solid #e5e7eb',
										cursor:
											disabled || loading !== null || isCompleted
												? 'not-allowed'
												: 'pointer',
									}}
								>
									{loading === `done:${s.id}`
										? '...'
										: isCompleted
											? 'Завершён'
											: 'Отметить завершённым'}
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
