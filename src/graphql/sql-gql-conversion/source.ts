/* 1st party imports - Object types / classes */
import { SourceSQL } from '@/services/source';
import { SourceGQL } from '@/graphql/types/source';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const sourceToGQL = <T extends SourceSQL | null>(source: T): T extends SourceSQL ? SourceGQL : null =>
{
	return source ? {
		...source,
		mediaCount: null,
		scans: null,
		scanUnderway: null,
	} as any : null;
};