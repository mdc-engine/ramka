'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPostJson } from '@/lib/api';

type Msg = { id: string; role: string; content: string; createdAt: string };

export function Chat({ sessionId }: { sessionId: string }) {
	const [messages, setMessages] = useState<Msg[]>([]);
	const [text, setText] = useState('');
	const [loading, setLoading] = useState(false);

	async function load() {
		const msgs = await apiGet<Msg[]>(`/sessions/${sessionId}/messages`, {
			cache: 'no-store',
		});
		setMessages(msgs);
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId]);

	async function send() {
		if (!text.trim()) return;
		setLoading(true);
		try {
			await apiPostJson<{ role: string; content: string }, unknown>(
				`/sessions/${sessionId}/messages`,
				{ role: 'therapist', content: text },
			);

			setText('');
			await load();
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div
				style={{
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					padding: 12,
					height: 420,
					overflow: 'auto',
					background: '#fff',
				}}
			>
				{messages.length === 0 ? (
					<div style={{ opacity: 0.7 }}>Пока нет сообщений. Напиши первое.</div>
				) : (
					messages.map((m) => (
						<div key={m.id} style={{ marginBottom: 10 }}>
							<div style={{ fontSize: 12, opacity: 0.6 }}>
								{m.role === 'therapist'
									? 'Ты'
									: m.role === 'client'
										? 'Клиент'
										: 'System'}
							</div>
							<div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
						</div>
					))
				)}
			</div>

			<div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
				<input
					suppressHydrationWarning
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Напиши сообщение..."
					style={{
						flex: 1,
						border: '1px solid #e5e7eb',
						borderRadius: 12,
						padding: '10px 12px',
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') send();
					}}
				/>
				<button
					onClick={send}
					disabled={loading}
					style={{
						borderRadius: 12,
						padding: '10px 14px',
						border: '1px solid #e5e7eb',
						cursor: loading ? 'not-allowed' : 'pointer',
					}}
				>
					{loading ? '...' : 'Отправить'}
				</button>
			</div>
		</div>
	);
}
