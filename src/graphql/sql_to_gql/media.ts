/* 1st party imports - Object types / classes */
import { MediaSQL } from '@/services/media';
import { MediaGQL } from '@/graphql/types/media';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

// TODO: Do I need such a complex type here?
export const media_to_gql = <T extends MediaSQL | null>(media: T): T extends MediaSQL ? MediaGQL : null =>
{
	return media ? {
		resource_id: media.resource_id,
		source_resource_id: media.source_resource_id,
		path: media.path,
		size: media.size,
		mime_type: media.mime_type,
	} as any : null;
};