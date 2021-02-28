/* 3rd party imports */
import { Resolver, Arg, Query, Ctx, FieldResolver, Root, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';

/* 1st party imports - Services */
import { MediaService } from '@/services/media';
import { SongService } from '@/services/song';
import { AlbumService } from '@/services/album';
import { AccessControlService, Operations } from '@/services/access-control';

/* 1st party imports - GraphQL types & inputs */
import { SongGQL } from '@/graphql/types/song';
import { MediaGQL } from '@/graphql/types/media';
import { AlbumGQL } from '@/graphql/types/album';

/* 1st party imports - SQL object to GQL object converters */
import { songToGQL } from '@/graphql/sql-gql-conversion/song';
import { mediaToGQL } from '@/graphql/sql-gql-conversion/media';
import { albumToGQL } from '@/graphql/sql-gql-conversion/album';

@Service()
@Resolver(_of => SongGQL)
export default class SongResolver implements ResolverInterface<SongGQL> {

	constructor (
		private mediaSvc: MediaService,
		private songSvc: SongService,
		private albumSvc: AlbumService,
		private aclSvc: AccessControlService,
	) {}

	@FieldResolver(_type => MediaGQL)
	media(@Root() root: SongGQL): MediaGQL {
		return mediaToGQL(this.mediaSvc.getMediaByID(root.mediaResourceID)!);
	}

	@FieldResolver(_type => AlbumGQL, {nullable: true})
	album(@Root() root: SongGQL): AlbumGQL | null {
		return albumToGQL(this.albumSvc.getSongAlbum(root.mediaResourceID));
	}

	/**
	 * @typegraphql Query a specific song.
	 */
	@AccessControl('READ', 'resourceID')
	@Query(_returns => SongGQL, {nullable: true})
	song(@Arg('resourceID') mediaResourceID: string): SongGQL | null {
		const song = this.songSvc.getSongByID(mediaResourceID);
		
		return song ? songToGQL(song) : null;
	}

	/**
	 * @typegraphql Query all songs the user has access to.
	 * @param sourceResourceID Optionally limit results to songs in a specific source.
	 */
	@AccessControl()
	@Query(_returns => [SongGQL], {nullable: true})
	songs(
		@Ctx() ctx: Context,
		@Arg('sourceResourceID', {nullable: true},
		) sourceResourceID?: string): SongGQL[] | null {
		const songs = this.songSvc.getAllSongs(sourceResourceID);

		if (songs)
			return songs.reduce<SongGQL[]>((acc, song) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.userID!, song.mediaResourceID);
				if (level >= Operations.READ)
					acc.push(songToGQL(song));
				return acc;
			}, []);

		return [];
	}
}