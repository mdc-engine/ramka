export type SessionListItem = {
	id: string;
	caseId: string;
	number: number;
	status: 'active' | 'completed';
	startedAt: string;
	endedAt: string | null;
	currentStageId: string | null;
	completedStageIds: string[];
	report: { createdAt: string } | null;
};
