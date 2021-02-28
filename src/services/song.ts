/* 3rd party imports */
import { basename } from 'path';
import * as mm from 'music-metadata';
import { Service, Container } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService, MediaSQL } from '@/services/media';

export interface SongSQL {
	mediaResourceID: string;
	title: string;
	year: number | null;
	trackNo: number | null;
	trackOf: number | null;
	diskNo: number | null;
	diskOf: number | null;
	releaseFormat: string | null;
	releaseCountry: string | null;
	duration: number | null;
	codec: string | null;
	lossless: number | null;
}
@Service()
export class SongService {

	constructor (
		private dbSvc: DatabaseService,
	) {}
	
	/* circular dependency */
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
			*
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
			Song.*
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
	 * Sets the correct MIME Type on the parent / supertype Media item.
	 * @param mediaResourceID ID of the Media item
	 * @returns Song
	 */
	async createSong(mediaResourceID: string): Promise<SongSQL | null> {
		let media: MediaSQL | null;
		let metadata: mm.IAudioMetadata;

		if (!(media = this.mediaSvc.getMediaByID(mediaResourceID)))
			return null;

		try {
			/* parse metadata */
			metadata = await mm.parseFile(media.path, {duration: false});
		} catch (err) {
			/* TODO: Log here - could not access or parse file */
			this.deleteSong(mediaResourceID);
			return null;
		}

		/* get properties out of metadata */
		const { container, duration, codec, lossless } = metadata.format;
		const { year, title } = metadata.common;

		/* add mimeType to Media object, cancel if can't or if no container metadata */
		if (!(container && this.mediaSvc.setMimeType(mediaResourceID, container))) {
			this.deleteSong(mediaResourceID);
			return null;
		}

		/* construct song object */
		const song: SongSQL = {
			mediaResourceID,
			title: title ?? `Untitled - ${basename(media.path)}`,
			year: year ? (year >= 1877 ? year : null) : null,
			trackNo: metadata.common.track.no ?? null,
			trackOf: metadata.common.track.of ?? null,
			diskNo: metadata.common.disk.no ?? null,
			diskOf: metadata.common.disk.of ?? null,
			releaseFormat: metadata.common.media ?? null,
			releaseCountry: metadata.common.releasecountry ?? null,
			duration: duration ?? null,
			codec: codec ?? null,
			lossless: lossless ? 1 : (lossless !== null ? 0 : null),
		};

		/* insert song into database */
		const success = this.dbSvc.prepare(`
		INSERT INTO Song
		(
			mediaResourceID,
			title,
			year,
			trackNo,
			trackOf,
			diskNo,
			diskOf,
			releaseFormat,
			releaseCountry,
			duration,
			codec,
			lossless
		)
		VALUES
		(
			$mediaResourceID,
			$title,
			$year,
			$trackNo,
			$trackOf,
			$diskNo,
			$diskOf,
			$releaseFormat,
			$releaseCountry,
			$duration,
			$codec,
			$lossless
		)
		`).run(song).changes > 0;

		/* if creation unsuccessful, delete the song and return null */
		return success ? this.getSongByID(mediaResourceID) : (this.deleteSong(mediaResourceID), null);
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