/* 1st party imports - Object types / classes */
import { AlbumSQL } from '@/services/album';
import { AlbumGQL } from '@/graphql/types/album';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const albumToGQL = <T extends AlbumSQL | null>(album: T): T extends AlbumSQL ? AlbumGQL : null =>
{
	return album ? {
		...album,
		songs: null,
	} as any : null;
};