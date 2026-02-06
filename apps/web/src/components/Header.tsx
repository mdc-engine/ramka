import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export function Header() {
	return (
		<header
			style={{
				borderBottom: '1px solid #e5e7eb',
				padding: '12px 16px',
			}}
		>
			<div
				style={{
					maxWidth: 900,
					margin: '0 auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 12,
				}}
			>
				<Link href="/" style={{ textDecoration: 'none', fontWeight: 700 }}>
					Ramka
				</Link>

				<nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
					<Link href="/" style={{ textDecoration: 'none' }}>
						Кейсы
					</Link>
					<Link href="/sessions" style={{ textDecoration: 'none' }}>
						Сессии
					</Link>
					<LogoutButton />
				</nav>
			</div>
		</header>
	);
}
