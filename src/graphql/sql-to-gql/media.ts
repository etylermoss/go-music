/* 1st party imports - Object types / classes */
import { MediaSQL } from '@/services/media';
import { MediaGQL } from '@/graphql/types/media';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

// TODO: Do I need such a complex type here?
export const mediaToGQL = <T extends MediaSQL | null>(media: T): T extends MediaSQL ? MediaGQL : null =>
{
	return media ? {
		resourceID: media.resourceID,
		sourceResourceID: media.sourceResourceID,
		path: media.path,
		size: media.size,
		mimeType: media.mimeType,
	} as any : null;
};