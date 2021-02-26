/* 3rd party imports */
import { Service, Inject, Container } from 'typedi';
import * as mm from 'music-metadata';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface SongSQL {
	mediaResourceID: string;
}

@Service('song.service')
export class SongService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get('media.service');
	}

	getSongByID(mediaResourceID: string): SongSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			mediaResourceID
		FROM
			Song
		WHERE
			mediaResourceID = $mediaResourceID
		`).get({mediaResourceID}) as SongSQL | undefined;

		return media ?? null;
	}

	getAllSongs(sourceResourceID?: string): SongSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			Song.mediaResourceID
		FROM
			Song
		INNER JOIN
			Media
		ON
			Media.resourceID = Song.mediaResourceID
		WHERE
			(
				($sourceResourceID IS null)
				OR (Media.sourceResourceID = $sourceResourceID)
			)
		`).all({sourceResourceID: sourceResourceID ?? null}) as SongSQL[];
	}

	async addSong(mediaResourceID: string): Promise<SongSQL | null> {
		const success = this.dbSvc.prepare(`
		INSERT INTO Song
		(
			mediaResourceID
		)
		VALUES
		(
			$mediaResourceID
		)
		`).run({mediaResourceID}).changes > 0;

		if (!success)
			return null;

		const media = this.mediaSvc.getMediaByID(mediaResourceID)!;
		const parseFileOpts: mm.IOptions = {
			duration: true,
		};

		let metadata: mm.IAudioMetadata;

		try {
			metadata = await mm.parseFile(media.path, parseFileOpts);
		} catch {
			/* could not access or parse file */
			// TODO: Log here
			this.removeSong(mediaResourceID);
			return null;
		}

		/* add mimeType to Media object */
		const container = metadata?.format?.container;
		if (!(container && this.mediaSvc.setMimeType(mediaResourceID, container)))
			this.removeSong(mediaResourceID);

		return this.getSongByID(mediaResourceID);
	}

	removeSong(mediaResourceID: string): boolean {
		return this.mediaSvc.removeMedia(mediaResourceID);
	}
}