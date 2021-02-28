/* 1st party imports - Object types / classes */
import { MediaSQL } from '@/services/media';
import { MediaGQL } from '@/graphql/types/media';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const mediaToGQL = <T extends MediaSQL | null>(media: T): T extends MediaSQL ? MediaGQL : null =>
{
	return media ? {
		...media,
	} as any : null;
};