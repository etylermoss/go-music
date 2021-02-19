/* 3rd party imports */
import { Resolver, Arg, Query, Ctx } from 'type-graphql';
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

/* 1st party imports - SQL object to GQL object converters */
import { song_to_gql } from '@/graphql/sql_to_gql/song';

@Service()
@Resolver(_of => SongGQL)
export default class SongResolver {

	@Inject('media.service')
	mediaSvc: MediaService;

	@Inject('song.service')
	songSvc: SongService;

	@Inject('access-control.service')
	aclSvc: AccessControlService;

	/** @typegraphql Query a user, must be logged in.
	 */
	@AccessControl('READ', 'resource_id')
	@Query(_returns => SongGQL, {nullable: true})
	song(@Arg('resource_id') media_resource_id: string): SongGQL | null {
		const song_sql = this.songSvc.getSongByID(media_resource_id);
		if (song_sql)
			return song_to_gql(song_sql, this.mediaSvc.getMediaByID(media_resource_id)!);
		else
			return null;
	}

	/** @typegraphql Query all songs the user has access to.
	 *  Can optionally limit results to songs in a specific source.
	 */
	@Query(_returns => [SongGQL], {nullable: true})
	songs(
		@Ctx() ctx: Context,
		@Arg('source_resource_id', {nullable: true},
		) source_resource_id?: string): SongGQL[] | null {
		const songs_sql = this.songSvc.getAllSongs(source_resource_id);

		if (songs_sql)
			return songs_sql.reduce<SongGQL[]>((acc, song) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.user_id!, song.media_resource_id);
				if (level && level >= Operations.READ)
					acc.push(song_to_gql(song, this.mediaSvc.getMediaByID(song.media_resource_id)!));
				return acc;
			}, []);

		return [];
	}
}