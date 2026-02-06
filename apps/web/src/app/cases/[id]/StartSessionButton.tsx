'use client';

import { apiPostJson } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StartSessionButton({ caseId }: { caseId: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function onStart() {
		try {
			setLoading(true);

			const session = await apiPostJson<{ caseId: string }, { id: string }>(
				'/sessions',
				{ caseId },
			);

			router.push(`/sessions/${session.id}`);
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			onClick={onStart}
			disabled={loading}
			style={{
				marginTop: 16,
				borderRadius: 12,
				padding: '10px 14px',
				border: '1px solid #e5e7eb',
				cursor: loading ? 'not-allowed' : 'pointer',
			}}
		>
			{loading ? 'Создаю...' : 'Начать сессию'}
		</button>
	);
}
