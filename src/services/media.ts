/* 3rd party imports */
import fs from 'fs';
import { extname } from 'path';
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { SongService } from '@/services/song';
import { ArtworkService } from '@/services/artwork';

/* 1st party imports - SQL types */
import { ResourceSQL } from '@/services/resource';

export interface MediaSQL {
	resourceID: string;
	sourceResourceID: string;
	path: string;
	size: number;
	subType: mediaSubType;
	mimeType: string | null;
}

export enum mediaSubType {
	UNSET = 0,
	SONG = 1,
	ARTWORK = 2,
}

/** Extensions seen by the server, used when
 *  searching for music files / album art.
 */
export const extensionWhitelist =
[
	'.mp3', '.opus', '.ogg', '.wav', '.flac', '.m4a',
	'.png', '.jpg', '.jpeg', '.bmp', '.gif',
];

// TODO: maybe construct up media and song items before adding to
// database, easier to cancel transaction.

@Service()
export class MediaService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
		private songSvc: SongService,
		private artSvc: ArtworkService,
	) {}

	/**
	 * Retrieve a media item, search by resourceID.
	 * @param resourceID ID of resource
	 * @returns Media
	 */
	getMediaByID(resourceID: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Media
		WHERE
			resourceID = ?
		`).get(resourceID) as MediaSQL | undefined;

		return media ?? null;
	}

	/**
	 * Retrieve a media item, search by path.
	 * @param path Filesystem path to search for
	 * @returns Media
	 */
	getMediaByPath(path: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Media
		WHERE
			path = ?
		`).get(path) as MediaSQL | undefined;

		return media ?? null;
	}

	/**
	 * Retrieve all media items.
	 * @param sourceResourceID Optional source ID to limit search to
	 * @returns Media array
	 */
	getAllMedia(sourceResourceID?: string): MediaSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Media
		WHERE
		(
			($sourceResourceID IS null)
			OR (sourceResourceID = $sourceResourceID)
		)
		`).all({sourceResourceID: sourceResourceID ?? null}) as MediaSQL[];
	}

	/**
	 * Retrieve number of media items.
	 * @param resourceID Optional source ID to limit count to
	 * @returns Number of media items
	 */
	getMediaCount(sourceResourceID?: string): number {
		return this.dbSvc.prepare(`
		SELECT
			COUNT(*)
		FROM
			Media
		WHERE
		(
			($sourceResourceID IS null)
			OR (sourceResourceID = $sourceResourceID)
		)
		`).pluck().get({sourceResourceID: sourceResourceID ?? null});
	}

	/**
	 * Set the subType and mimeType fields on the given media item (ID).
	 * @param resourceID ID of resource
	 * @param metadataContainer Metadata container field to match against
	 * @returns Success of operation
	 */
	updateMedia(resourceID: string, subType: mediaSubType, metadataContainer: string): boolean {
		let mimeType: string | null = null;

		switch (metadataContainer) {
			case 'FLAC':
				mimeType = 'audio/flac'; break;
			case 'WAVE':
				mimeType = 'audio/wav'; break;
			case 'MPEG':
				mimeType = 'audio/mp3'; break;
			case 'Ogg':
				mimeType = 'audio/ogg'; break;
			case 'M4A/mp42/isom':
				mimeType = 'audio/mp4'; break;
		}
		// TODO: Log - if no match

		if (mimeType !== null)
		{
			return this.dbSvc.prepare(`
			UPDATE
				Media
			SET
				subType = $subType,
				mimeType = $mimeType
			WHERE
				resourceID = $resourceID
			`).run({resourceID, subType, mimeType}).changes > 0;
		}

		return false;
	}

	/**
	 * Create subtype song or artwork from the given media item, guessing
	 * correct format from the file extension (see extensionWhitelist).
	 * @param media Supertype media item to parse
	 */
	async mediaParser(media: MediaSQL): Promise<boolean> {
		const fileExt = extname(media.path).toLowerCase();

		// TODO: Log - if no match
		switch (fileExt) {
			case '.mp3':
			case '.opus':
			case '.ogg':
			case '.wav':
			case '.flac':
			case '.m4a':
				return await this.songSvc.createSong(media.resourceID) ? true : false;
			case '.png':
			case '.jpg':
			case '.jpeg':
			case '.bmp':
			case '.gif':
				return this.artSvc.createArtwork(media.resourceID) ? true : false;
		}

		return false;
	}

	/**
	 * Create new media item.
	 * It is automatically parsed into the correct subtype (e.g. song).
	 * @param path Filesystem path of the item
	 * @param fh Active FileHandle to stat the file
	 * @param ownerUserID Owner of the created item / resource
	 * @param sourceResourceID Parent source ID
	 * @returns Media
	 */
	async createMedia(path: string, ownerUserID: string, sourceResourceID: string): Promise<MediaSQL | null> {
		let resource: ResourceSQL | null;
		let size: number;

		try {
			size = (await fs.promises.stat(path)).size;
		} catch {
			return null;
		}

		if (!(resource = this.rsrcSvc.createResource(ownerUserID)))
			return null;

		const media: MediaSQL = {
			resourceID: resource.resourceID,
			sourceResourceID: sourceResourceID,
			path,
			size,
			subType: mediaSubType.UNSET,
			mimeType: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Media
		(
			resourceID,
			sourceResourceID,
			path,
			size,
			subType,
			mimeType
		)
		VALUES
		(
			$resourceID,
			$sourceResourceID,
			$path,
			$size,
			$subType,
			$mimeType
		)
		`).run(media).changes > 0;

		if (success) {
			const parse = await this.mediaParser(media);
			return parse ? this.getMediaByID(media.resourceID) : (this.deleteMedia(media.resourceID), null);
		}
			
		return null;
	}

	/**
	 * Delete a media item, search by resourceID.
	 * @param resourceID ID of resource
	 * @returns Success of deletion
	 */
	deleteMedia(resourceID: string): boolean {
		return this.rsrcSvc.deleteResource(resourceID);
	}
}