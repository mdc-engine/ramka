import 'server-only';
import { cookies } from 'next/headers';

type ApiError = Error & { status?: number; url?: string; body?: string };

const API_BASE =
	process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
	'http://localhost:3001';

function normalizePath(path: string) {
	return path.startsWith('/') ? path : `/${path}`;
}

type ApiServerOptions = {
	redirectOn401?: boolean; // default true
	throwOnNonOk?: boolean; // default true
};

export async function apiFetchServer(
	path: string,
	init: RequestInit = {},
	opts: ApiServerOptions = {},
) {
	const url = `${API_BASE}${normalizePath(path)}`;
	const headers = new Headers(init.headers);

	// Next 16: cookies() -> Promise
	const cookieStore = await cookies();
	const sid = cookieStore.get('sid')?.value;
	if (sid) headers.set('cookie', `sid=${sid}`);

	const res = await fetch(url, {
		...init,
		headers,
		cache: init.cache ?? 'no-store',
	});

	const redirectOn401 = opts.redirectOn401 ?? true;
	const throwOnNonOk = opts.throwOnNonOk ?? true;

	if (!res.ok && throwOnNonOk) {
		const err: ApiError = new Error(
			`API ${res.status} ${res.statusText}: ${url}`,
		);
		err.status = res.status;
		err.url = url;
		try {
			err.body = await res.text();
		} catch {}

		if (res.status === 401 && redirectOn401) {
			const { redirect } = await import('next/navigation');
			redirect('/login');
		}

		throw err;
	}

	return res;
}

export async function apiGetServer<T>(
	path: string,
	init: RequestInit = {},
	opts: ApiServerOptions = {},
) {
	const res = await apiFetchServer(path, { ...init, method: 'GET' }, opts);
	return (await res.json()) as T;
}
