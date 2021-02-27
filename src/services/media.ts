/* 3rd party imports */
import fs from 'fs';
import { extname } from 'path';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { SongService } from '@/services/song';
import { ArtworkService } from '@/services/artwork';

export interface MediaSQL {
	resourceID: string;
	sourceResourceID: string;
	path: string;
	size: number;
	mimeType: string | null;
}

/** Extensions seen by the server, used when
 *  searching for music files / album art.
 */
export const extensionWhitelist =
[
	'.mp3', '.opus', '.ogg', '.wav', '.flac', '.m4a',
	'.png', '.jpg', '.jpeg', '.bmp', '.gif',
];

@Service('media.service')
export class MediaService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	@Inject('song.service')
	private songSvc: SongService;

	@Inject('artwork.service')
	private artSvc: ArtworkService;

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
			resourceID = $resourceID
		`).get({resourceID}) as MediaSQL | undefined;

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
			path = $path
		`).get({path}) as MediaSQL | undefined;

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
	 * Set the MIME type field on the media item, search by resourceID.
	 * @param resourceID ID of resource
	 * @param metadataContainer Metadata container field to match against
	 * @returns Success of operation
	 */
	setMimeType(resourceID: string, metadataContainer: string): boolean {
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
				mimeType = ?
			WHERE
				resourceID = ?
			`).run(mimeType, resourceID).changes > 0;
		}

		return false;
	}

	// TODO: follow path of song/artwork deletion, is media actually
	// deleted since it cascades down but not up? and below we aren't
	// getting success of createSong / createArtwork.

	// TODO: maybe construct up media and song items before adding to
	// database, easier to cancel transaction.

	/**
	 * Create subtype song or artwork from the given media item, guessing
	 * correct format from the file extension (see extensionWhitelist).
	 * @param media Supertype media item to parse
	 */
	async mediaParser(media: MediaSQL): Promise<void> {
		const fileExt = extname(media.path).toLowerCase();

		// TODO: return song / artwork or success?
		// TODO: Log - if no match
		switch (fileExt) {
			case '.mp3':
			case '.opus':
			case '.ogg':
			case '.wav':
			case '.flac':
			case '.m4a':
				await this.songSvc.createSong(media.resourceID);
				break;
			case '.png':
			case '.jpg':
			case '.jpeg':
			case '.bmp':
			case '.gif':
				await this.artSvc.createArtwork(media.resourceID);
				break;
		}
	}

	// TODO: fixup fh, just pass in size

	/**
	 * Create new media item.
	 * It is automatically parsed into the correct subtype (e.g. song).
	 * @param path Filesystem path of the item
	 * @param fh Active FileHandle to stat the file
	 * @param ownerUserID Owner of the created item / resource
	 * @param sourceResourceID Parent source ID
	 * @returns Media
	 */
	async createMedia(path: string, fh: fs.promises.FileHandle, ownerUserID: string, sourceResourceID: string): Promise<MediaSQL | null> {
		const resource = this.rsrcSvc.createResource(ownerUserID);

		if (!resource)
		{
			return null;
		}

		const media: MediaSQL = {
			resourceID: resource.resourceID,
			sourceResourceID: sourceResourceID,
			path,
			size: (await fh.stat()).size,
			mimeType: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Media
		(
			resourceID,
			sourceResourceID,
			path,
			size,
			mimeType
		)
		VALUES
		(
			$resourceID,
			$sourceResourceID,
			$path,
			$size,
			$mimeType
		)
		`).run(media).changes > 0;

		if (success)
		{
			await this.mediaParser(media);
			
			return this.getMediaByID(media.resourceID);
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