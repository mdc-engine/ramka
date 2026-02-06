import Link from 'next/link';
import { ReportViewer } from './viewer';

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
			<Link href={`/sessions/${id}`} style={{ textDecoration: 'none' }}>
				← Назад к чату
			</Link>

			<h1 style={{ marginTop: 12, fontSize: 22, fontWeight: 700 }}>
				Отчёт по сессии
			</h1>

			<div style={{ marginTop: 16 }}>
				<ReportViewer sessionId={id} />
			</div>
		</main>
	);
}
