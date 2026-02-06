'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SessionListItem } from './types';
import { formatDateTimeISOish } from '@/lib/datetime';

type Filter = 'all' | 'active' | 'completed';

export function SessionsList({
	initialSessions,
}: {
	initialSessions: SessionListItem[];
}) {
	const [filter, setFilter] = useState<Filter>('all');
	const [q, setQ] = useState('');

	const sessions = useMemo(() => {
		const qq = q.trim().toLowerCase();

		return initialSessions
			.filter((s) => (filter === 'all' ? true : s.status === filter))
			.filter((s) => (qq ? s.caseId.toLowerCase().includes(qq) : true));
	}, [initialSessions, filter, q]);

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<h1 style={{ marginTop: 0, fontSize: 22, fontWeight: 700 }}>
				Мои сессии
			</h1>

			<div
				style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}
			>
				<select
					value={filter}
					onChange={(e) => setFilter(e.target.value as Filter)}
					style={{
						border: '1px solid #e5e7eb',
						borderRadius: 12,
						padding: '10px 12px',
					}}
				>
					<option value="all">Все</option>
					<option value="active">Активные</option>
					<option value="completed">Завершённые</option>
				</select>

				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Поиск по caseId (например c001)"
					style={{
						flex: 1,
						minWidth: 240,
						border: '1px solid #e5e7eb',
						borderRadius: 12,
						padding: '10px 12px',
					}}
				/>
			</div>

			{sessions.length === 0 ? (
				<div style={{ opacity: 0.75, marginTop: 12 }}>Ничего не найдено.</div>
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
									{s.caseId} · сессия #{s.number} ·{' '}
									{s.status === 'completed' ? 'завершена' : 'активная'}
								</div>
								<div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>
									{formatDateTimeISOish(s.startedAt)}
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</main>
	);
}
