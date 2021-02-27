/* 3rd party imports */
import { Service, Container } from 'typedi';
import * as mm from 'music-metadata';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface SongSQL {
	mediaResourceID: string;
}

@Service()
export class SongService {

	constructor (
		private dbSvc: DatabaseService,
	) {}
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get(MediaService);
	}

	/**
	 * Retrieve a song, search by mediaResourceID.
	 * @param mediaResourceID ID of song
	 * @returns Song
	 */
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

	/**
	 * Retrieve all songs.
	 * @param sourceResourceID Optional source ID to limit search to
	 * @returns Song array
	 */
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

	/**
	 * Create new song.
	 * Sets the correct MIME Type on the parent supertype / parent Media item.
	 * @param mediaResourceID ID of the Media item
	 * @returns Song
	 */
	async createSong(mediaResourceID: string): Promise<SongSQL | null> {
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
			this.deleteSong(mediaResourceID);
			return null;
		}

		/* add mimeType to Media object */
		const container = metadata?.format?.container;
		if (!(container && this.mediaSvc.setMimeType(mediaResourceID, container)))
			this.deleteSong(mediaResourceID);

		return this.getSongByID(mediaResourceID);
	}

	/**
	 * Delete a song, search by mediaResourceID.
	 * @param mediaResourceID ID of song
	 * @returns Success of deletion
	 */
	deleteSong(mediaResourceID: string): boolean {
		return this.mediaSvc.deleteMedia(mediaResourceID);
	}
}