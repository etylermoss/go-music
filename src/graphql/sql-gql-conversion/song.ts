/* 1st party imports - Object types / classes */
import { SongSQL } from '@/services/song';
import { SongGQL } from '@/graphql/types/song';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const songToGQL = <T extends SongSQL | null>(song: T): T extends SongSQL ? SongGQL : null =>
{
	return song ? {
		...song,
		lossless: song.lossless === 1 ? true : (song.lossless === 0 ? false : null),
		media: null,
		album: null,
	} as any : null;
};