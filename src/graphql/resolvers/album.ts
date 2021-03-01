/* 3rd party imports */
import { Resolver, Arg, Query, Ctx, FieldResolver, Root, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';

/* 1st party imports - Services */
import { AlbumService } from '@/services/album';
import { AccessControlService, Operations } from '@/services/access-control';
import { AlbumSongService } from '@/services/album-song';

/* 1st party imports - GraphQL types & inputs */
import { AlbumGQL } from '@/graphql/types/album';
import { SongGQL } from '@/graphql/types/song';

/* 1st party imports - SQL object to GQL object converters */
import { songToGQL } from '@/graphql/sql-gql-conversion/song';
import { albumToGQL } from '@/graphql/sql-gql-conversion/album';

@Service()
@Resolver(_of => AlbumGQL)
export default class AlbumResolver implements ResolverInterface<AlbumGQL> {

	constructor (
		private albumSvc: AlbumService,
		private albumSongSvc: AlbumSongService,
		private aclSvc: AccessControlService,
	) {}

	@FieldResolver(_type => [SongGQL])
	songs(@Root() root: AlbumGQL): SongGQL[] {
		const songs = this.albumSongSvc.getAlbumSongs(root.resourceID);
		return songs ? songs.map<SongGQL>(song => songToGQL(song)) : [];
	}

	/**
	 * @typegraphql Query a specific album.
	 */
	@AccessControl('READ', 'resourceID')
	@Query(_returns => AlbumGQL, {nullable: true})
	album(@Arg('resourceID') resourceID: string): AlbumGQL | null {
		const album = this.albumSvc.getAlbumByID(resourceID);
		return album ? albumToGQL(album) : null;
	}

	/**
	 * @typegraphql Query all albums the user has access to.
	 */
	@AccessControl()
	@Query(_returns => [AlbumGQL], {nullable: true})
	albums(@Ctx() ctx: Context): AlbumGQL[] | null {
		const albums = this.albumSvc.getAllAlbums();

		if (albums)
			return albums.reduce<AlbumGQL[]>((acc, album) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.userID!, album.resourceID);
				if (level >= Operations.READ)
					acc.push(albumToGQL(album));
				return acc;
			}, []);

		return [];
	}
}