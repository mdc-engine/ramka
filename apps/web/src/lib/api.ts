type ApiError = Error & { status?: number; url?: string; body?: string };

const API_BASE =
	process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
	'http://localhost:3001';

function normalizePath(path: string) {
	return path.startsWith('/') ? path : `/${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
	const url = `${API_BASE}${normalizePath(path)}`;
	const headers = new Headers(init.headers);

	const res = await fetch(url, {
		...init,
		headers,
		credentials: 'include',
	});

	if (!res.ok) {
		const err: ApiError = new Error(
			`API ${res.status} ${res.statusText}: ${url}`,
		);
		err.status = res.status;
		err.url = url;
		try {
			err.body = await res.text();
		} catch {}

		if (res.status === 401 && typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw err;
	}

	return res;
}

export async function apiGet<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const res = await apiFetch(path, { ...init, method: 'GET' });
	return (await res.json()) as T;
}

export async function apiPostJson<TBody, TResp>(
	path: string,
	body: TBody,
	init: RequestInit = {},
): Promise<TResp> {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type'))
		headers.set('Content-Type', 'application/json');

	const res = await apiFetch(path, {
		...init,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});

	return (await res.json()) as TResp;
}
