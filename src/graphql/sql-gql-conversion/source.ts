/* 1st party imports - Object types / classes */
import { SourceSQL } from '@/services/source';
import { SourceGQL } from '@/graphql/types/source';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const sourceToGQL = <T extends SourceSQL | null>(source: T): T extends SourceSQL ? SourceGQL : null =>
{
	return source ? {
		resourceID: source.resourceID,
		name: source.name,
		path: source.path,
		scans: null,
		scanUnderway: null,
	} as any : null;
};