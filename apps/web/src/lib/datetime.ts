export function formatDateTimeISOish(value: string | Date) {
	const d = typeof value === 'string' ? new Date(value) : value;

	// фиксируем locale и timezone, чтобы сервер и клиент выдавали одинаково
	return new Intl.DateTimeFormat('ru-RU', {
		timeZone: 'Europe/Amsterdam',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(d);
}
