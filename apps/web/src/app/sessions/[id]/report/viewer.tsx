'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Scores = {
	structure: number;
	engagement: number;
	clarity: number;
};

type Ready = {
	status: 'ready';
	report: {
		summary: string;
		scores: Scores;
		payload: unknown;
		createdAt: string;
	};
};
type Pending = { status: 'pending' };
type Resp = Ready | Pending;

function isRecord(x: unknown): x is Record<string, unknown> {
	return typeof x === 'object' && x !== null;
}

export function ReportViewer({ sessionId }: { sessionId: string }) {
	const [data, setData] = useState<Resp>({ status: 'pending' });

	async function load() {
		const json = await apiGet<Resp>(`/sessions/${sessionId}/report`, {
			cache: 'no-store',
		});
		setData(json);
	}

	useEffect(() => {
		load();
		const t = setInterval(load, 1500);
		return () => clearInterval(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId]);

	if (data.status === 'pending') {
		return <div style={{ opacity: 0.75 }}>Отчёт генерируется…</div>;
	}

	const progress =
		isRecord(data.report.payload) && isRecord(data.report.payload['progress'])
			? (data.report.payload['progress'] as Record<string, unknown>)
			: null;

	return (
		<div>
			{progress && (
				<>
					<div style={{ fontWeight: 600 }}>Progress</div>
					<pre
						style={{
							marginTop: 8,
							padding: 12,
							border: '1px solid #e5e7eb',
							borderRadius: 12,
							overflow: 'auto',
						}}
					>
						{JSON.stringify(progress, null, 2)}
					</pre>
				</>
			)}

			<div style={{ marginTop: 16, fontWeight: 600 }}>Summary</div>
			<div style={{ marginTop: 6 }}>{data.report.summary}</div>

			<div style={{ marginTop: 16, fontWeight: 600 }}>Scores</div>
			<pre
				style={{
					marginTop: 8,
					padding: 12,
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					overflow: 'auto',
				}}
			>
				{JSON.stringify(data.report.scores, null, 2)}
			</pre>

			<div style={{ marginTop: 16, fontWeight: 600 }}>Payload</div>
			<pre
				style={{
					marginTop: 8,
					padding: 12,
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					overflow: 'auto',
				}}
			>
				{JSON.stringify(data.report.payload, null, 2)}
			</pre>
		</div>
	);
}
