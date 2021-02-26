/* 3rd party imports */
import { Resolver, Arg, Query, Ctx, FieldResolver, Root } from 'type-graphql';
import { Service, Inject } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';

/* 1st party imports - Services */
import { MediaService } from '@/services/media';
import { SongService } from '@/services/song';
import { AccessControlService, Operations } from '@/services/access-control';

/* 1st party imports - GraphQL types & inputs */
import { SongGQL } from '@/graphql/types/song';
import { MediaGQL } from '@/graphql/types/media';

/* 1st party imports - SQL object to GQL object converters */
import { songToGQL } from '@/graphql/sql-to-gql/song';
import { mediaToGQL } from '@/graphql/sql-to-gql/media';

@Service()
@Resolver(_of => SongGQL)
export default class SongResolver {

	@Inject('media.service')
	mediaSvc: MediaService;

	@Inject('song.service')
	songSvc: SongService;

	@Inject('access-control.service')
	aclSvc: AccessControlService;

	@FieldResolver(_type => MediaGQL)
	media(@Root() root: SongGQL): MediaGQL {
		return mediaToGQL(this.mediaSvc.getMediaByID(root.mediaResourceID)!);
	}

	/** @typegraphql Query a user, must be logged in.
	 */
	@AccessControl('READ', 'resourceID')
	@Query(_returns => SongGQL, {nullable: true})
	song(@Arg('resourceID') mediaResourceID: string): SongGQL | null {
		const song = this.songSvc.getSongByID(mediaResourceID);
		
		return song ? songToGQL(song) : null;
	}

	/** @typegraphql Query all songs the user has access to.
	 *  Can optionally limit results to songs in a specific source.
	 */
	@Query(_returns => [SongGQL], {nullable: true})
	songs(
		@Ctx() ctx: Context,
		@Arg('sourceResourceID', {nullable: true},
		) sourceResourceID?: string): SongGQL[] | null {
		const songs = this.songSvc.getAllSongs(sourceResourceID);

		if (songs)
			return songs.reduce<SongGQL[]>((acc, song) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.userID!, song.mediaResourceID);
				if (level && level >= Operations.READ)
					acc.push(songToGQL(song));
				return acc;
			}, []);

		return [];
	}
}