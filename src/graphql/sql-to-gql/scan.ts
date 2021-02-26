/* 1st party imports - Object types / classes */
import { ScanSQL } from '@/services/scan';
import { ScanGQL } from '@/graphql/types/scan';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const scanToGQL = <T extends ScanSQL | null>(scan: T): T extends ScanSQL ? ScanGQL : null =>
{
	return scan ? {
		scanID: scan.scanID,
		startTime: new Date(scan.startTime * 1000),
		endTime: scan.endTime ? new Date(scan.endTime * 1000) : null,
		changesAdd: scan.changesAdd,
		changesRemove: scan.changesRemove,
	} as any : null;
};