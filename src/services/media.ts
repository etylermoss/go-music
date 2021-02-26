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

	setMimeType(mediaResourceID: string, metadataContainer: string): boolean {
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
			`).run(mimeType, mediaResourceID).changes > 0;
		}

		return false;
	}

	async mediaParser({path, resourceID}: MediaSQL): Promise<void> {
		const fileExt = extname(path).toLowerCase();

		// TODO: return song / artwork or success?
		// TODO: Log - if no match
		switch (fileExt) {
			case '.mp3':
			case '.opus':
			case '.ogg':
			case '.wav':
			case '.flac':
			case '.m4a':
				await this.songSvc.addSong(resourceID);
				break;
			case '.png':
			case '.jpg':
			case '.jpeg':
			case '.bmp':
			case '.gif':
				await this.artSvc.addArtwork(resourceID);
				break;
		}
	}

	async addMedia(path: string, fh: fs.promises.FileHandle, ownerUserID: string, sourceResourceID: string): Promise<MediaSQL | null> {
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

	removeMedia(resourceID: string): boolean {
		return this.rsrcSvc.removeResource(resourceID);
	}
}