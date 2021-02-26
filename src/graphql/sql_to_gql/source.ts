/* 1st party imports - Object types / classes */
import { SourceSQL } from '@/services/source';
import { SourceGQL } from '@/graphql/types/source';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const source_to_gql = <T extends SourceSQL | null>(source: T): T extends SourceSQL ? SourceGQL : null =>
{
	return source ? {
		resource_id: source.resource_id,
		name: source.name,
		path: source.path,
		scans: null,
		scan_underway: null,
	} as any : null;
};