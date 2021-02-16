/* 1st party imports - Object types / classes */
import { ScanSQL } from '@/services/scan';
import { ScanGQL } from '@/graphql/types/scan';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const scan_to_gql = <T extends ScanSQL | null>(scan: T): T extends ScanSQL ? ScanGQL : null =>
{
	return scan ? {
		scan_id: scan.scan_id,
		source_resource_id: scan.source_resource_id,
		start_timestamp: new Date(scan.start_timestamp * 1000),
		end_timestamp: scan.end_timestamp ? new Date(scan.end_timestamp * 1000) : null,
		changes: scan.changes,
	} as any : null;
};