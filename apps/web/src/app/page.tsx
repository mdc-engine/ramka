import { apiGetServer } from '@/lib/api.server';
import Link from 'next/link';

type CaseListItem = {
	id: string;
	title: string;
	tags: string[];
	difficulty: number;
	method: string;
};

async function getCases(): Promise<CaseListItem[]> {
	return apiGetServer<CaseListItem[]>('/cases', { cache: 'no-store' });
}

export default async function Page() {
	const cases = await getCases();

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<div style={{ marginBottom: 12 }}>
				<Link href="/sessions" style={{ textDecoration: 'none' }}>
					Мои сессии →
				</Link>
			</div>

			<h1 style={{ fontSize: 28, fontWeight: 700 }}>Каталог кейсов</h1>

			<div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
				{cases.map((c) => (
					<a
						key={c.id}
						href={`/cases/${c.id}`}
						style={{
							display: 'block',
							border: '1px solid #e5e7eb',
							borderRadius: 12,
							padding: 16,
							textDecoration: 'none',
						}}
					>
						<div style={{ fontSize: 18, fontWeight: 600 }}>{c.title}</div>
						<div style={{ marginTop: 6, opacity: 0.75 }}>
							{c.method} · сложность {c.difficulty}
						</div>
						<div
							style={{
								marginTop: 10,
								display: 'flex',
								gap: 8,
								flexWrap: 'wrap',
							}}
						>
							{c.tags.map((t) => (
								<span
									key={t}
									style={{
										fontSize: 12,
										border: '1px solid #e5e7eb',
										borderRadius: 999,
										padding: '2px 10px',
										opacity: 0.85,
									}}
								>
									{t}
								</span>
							))}
						</div>
					</a>
				))}
			</div>
		</main>
	);
}
