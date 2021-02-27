/* 1st party imports - Object types / classes */
import { SongSQL } from '@/services/song';
import { SongGQL } from '@/graphql/types/song';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

// TODO: Do I need such a complex type here?
export const songToGQL = <T extends SongSQL | null>(song: T): T extends SongSQL ? SongGQL : null =>
{
	return song ? {
		mediaResourceID: song.mediaResourceID,
		media: null,
	} as any : null;
};