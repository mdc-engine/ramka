import { redirect } from 'next/navigation';
import { apiFetchServer } from '@/lib/api.server';
import { LoginForm } from './LoginForm';

type MeResp = { userId: string | null };

export default async function Page() {
	// ВАЖНО: не редиректим и не throw при 401, чтобы не было циклов
	const res = await apiFetchServer(
		'/auth/me',
		{ cache: 'no-store', method: 'GET' },
		{ redirectOn401: false, throwOnNonOk: false },
	);

	if (res.status === 200) {
		const me = (await res.json()) as MeResp;
		if (me.userId) redirect('/');
	}

	return (
		<main style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
			<h1 style={{ fontSize: 24, fontWeight: 700 }}>Вход</h1>
			<div style={{ opacity: 0.75, marginTop: 6 }}>
				Телефон → код (в dev код печатается в логе API)
			</div>

			<div style={{ marginTop: 16 }}>
				<LoginForm />
			</div>
		</main>
	);
}
