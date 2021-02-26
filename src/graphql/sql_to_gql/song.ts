/* 1st party imports - Object types / classes */
import { SongSQL } from '@/services/song';
import { MediaSQL } from '@/services/media';
import { SongGQL } from '@/graphql/types/song';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

// TODO: Do I need such a complex type here?
export const song_to_gql = <T extends SongSQL | null>(song: T, media: MediaSQL): T extends SongSQL ? SongGQL : null =>
{
	return song ? {
		media_resource_id: song.media_resource_id,
		media: media,
	} as any : null;
};