'use client';

import { useState } from 'react';
import { apiPostJson } from '@/lib/api';

type ChallengeResp = { ok: true; resendAt: string };
type VerifyResp = { ok: true };

export function LoginForm() {
	const [phone, setPhone] = useState('+79990000000');
	const [code, setCode] = useState('');
	const [step, setStep] = useState<'phone' | 'code'>('phone');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resendAt, setResendAt] = useState<string | null>(null);

	async function sendCode() {
		setLoading(true);
		setError(null);
		try {
			const resp = await apiPostJson<
				{ phone: string; channel: 'sms' },
				ChallengeResp
			>('/auth/challenge', { phone: phone.trim(), channel: 'sms' });

			setResendAt(resp.resendAt);
			setStep('code');
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}

	async function verify() {
		setLoading(true);
		setError(null);
		try {
			await apiPostJson<{ phone: string; code: string }, VerifyResp>(
				'/auth/verify',
				{ phone: phone.trim(), code: code.trim() },
			);

			// cookie sid выставлен, можно на главную
			const sp = new URLSearchParams(window.location.search);
			const next = sp.get('next');
			window.location.href = next && next.startsWith('/') ? next : '/';
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: 'grid', gap: 10 }}>
			<label style={{ display: 'grid', gap: 6 }}>
				<div style={{ fontSize: 12, opacity: 0.75 }}>Телефон</div>
				<input
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="+79990000000"
					style={{
						border: '1px solid #e5e7eb',
						borderRadius: 12,
						padding: '10px 12px',
					}}
				/>
			</label>

			{step === 'code' && (
				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, opacity: 0.75 }}>Код</div>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="123456"
						style={{
							border: '1px solid #e5e7eb',
							borderRadius: 12,
							padding: '10px 12px',
						}}
					/>
				</label>
			)}

			{error && (
				<div style={{ color: '#b91c1c', fontSize: 12, whiteSpace: 'pre-wrap' }}>
					{error}
				</div>
			)}

			{step === 'phone' ? (
				<button
					onClick={sendCode}
					disabled={loading}
					style={{
						borderRadius: 12,
						padding: '10px 14px',
						border: '1px solid #e5e7eb',
						cursor: loading ? 'not-allowed' : 'pointer',
					}}
				>
					{loading ? '...' : 'Получить код'}
				</button>
			) : (
				<button
					onClick={verify}
					disabled={loading || !code.trim()}
					style={{
						borderRadius: 12,
						padding: '10px 14px',
						border: '1px solid #e5e7eb',
						cursor: loading ? 'not-allowed' : 'pointer',
					}}
				>
					{loading ? '...' : 'Войти'}
				</button>
			)}

			{resendAt && (
				<div style={{ fontSize: 12, opacity: 0.7 }}>
					Повторная отправка после: {new Date(resendAt).toLocaleTimeString()}
				</div>
			)}
		</div>
	);
}
