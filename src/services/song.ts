/* 3rd party imports */
import { Service, Inject, Container } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface SongSQL {
	media_resource_id: string;
}

@Service('song.service')
export class SongService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get('media.service');
	}

	getSongByID(media_resource_id: string): SongSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			media_resource_id
		FROM
			Song
		WHERE
			media_resource_id = $media_resource_id
		`).get({media_resource_id}) as SongSQL | undefined;

		return media ?? null;
	}

	getAllSongs(source_resource_id?: string): SongSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			Song.media_resource_id,
		FROM
			Song
		INNER JOIN
			Media
		ON
			Media.resource_id = Song.media_resource_id
		WHERE
			(
				($source_resource_id IS null)
				OR (Media.source_resource_id = $source_resource_id)
			)
		`).all({source_resource_id: source_resource_id ?? null}) as SongSQL[];
	}

	addSong(media_resource_id: string): SongSQL | null {
		const success = this.dbSvc.prepare(`
		INSERT INTO Song
		(
			media_resource_id
		)
		VALUES
		(
			$media_resource_id
		)
		`).run({media_resource_id}).changes > 0;

		return success ? this.getSongByID(media_resource_id) : null;
	}

	removeSong(media_resource_id: string): boolean {
		return this.mediaSvc.removeMedia(media_resource_id);
	}
}