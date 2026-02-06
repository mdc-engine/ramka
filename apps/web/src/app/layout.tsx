import type { Metadata } from 'next';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
	title: 'Рамка',
	description: 'Тренажёр сессий для психологов',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ru">
			<body>
				<Header />

				<div>{children}</div>
			</body>
		</html>
	);
}
