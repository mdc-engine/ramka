'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function onComplete() {
		setLoading(true);
		try {
			await apiFetch(`/sessions/${sessionId}/complete`, { method: 'POST' });
			router.push(`/sessions/${sessionId}/report`);
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			onClick={onComplete}
			disabled={loading}
			style={{
				borderRadius: 12,
				padding: '10px 14px',
				border: '1px solid #e5e7eb',
				cursor: loading ? 'not-allowed' : 'pointer',
			}}
		>
			{loading ? 'Завершаю...' : 'Завершить сессию'}
		</button>
	);
}
