'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function LogoutButton() {
	const [loading, setLoading] = useState(false);

	async function onLogout() {
		setLoading(true);
		try {
			await apiFetch('/auth/logout', { method: 'POST' });
			window.location.href = '/login';
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			onClick={onLogout}
			disabled={loading}
			style={{
				borderRadius: 12,
				padding: '8px 12px',
				border: '1px solid #e5e7eb',
				cursor: loading ? 'not-allowed' : 'pointer',
			}}
		>
			{loading ? '...' : 'Выйти'}
		</button>
	);
}
