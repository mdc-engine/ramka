import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isPublicPath(pathname: string) {
	return (
		pathname === '/login' ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/favicon.ico')
	);
}

export function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;

	if (isPublicPath(pathname)) return NextResponse.next();

	const isProtected =
		pathname === '/' ||
		pathname.startsWith('/cases') ||
		pathname.startsWith('/sessions');

	if (!isProtected) return NextResponse.next();

	const sid = req.cookies.get('sid')?.value;
	if (!sid) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		url.searchParams.set('next', pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

// Чтобы middleware не выполнялся вообще на статике
export const config = {
	matcher: ['/(.*)'],
};
