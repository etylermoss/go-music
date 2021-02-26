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
	resource_id: string;
	source_resource_id: string;
	path: string;
	size: number;
	mime_type: string | null;
}

/** Extensions seen by the server, used when
 *  searching for music files / album art.
 */
export const extension_whitelist =
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

	getMediaByID(resource_id: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			path
		FROM
			Media
		WHERE
			resource_id = $resource_id
		`).get({resource_id}) as MediaSQL | undefined;

		return media ?? null;
	}

	getMediaByPath(path: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			path
		FROM
			Media
		WHERE
			path = $path
		`).get({path}) as MediaSQL | undefined;

		return media ?? null;
	}

	getAllMedia(source_resource_id?: string): MediaSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			path
		FROM
			Media
		WHERE
			(
				($source_resource_id IS null)
				OR (source_resource_id = $source_resource_id)
			)
		`).all({source_resource_id: source_resource_id ?? null}) as MediaSQL[];
	}

	// TODO: export extension whitelist from here
	async mediaParser({path, resource_id}: MediaSQL): Promise<void> {
		const fileExt = extname(path).toLowerCase();

		// TODO: Serve error to log service if matching extension not found (should be)
		switch (fileExt) {
			case '.mp3':
			case '.opus':
			case '.ogg':
			case '.wav':
			case '.flac':
			case '.m4a':
				await this.songSvc.addSong(resource_id); // TODO: assign to variable so can return it from this function
				break;
			case '.png':
			case '.jpg':
			case '.jpeg':
			case '.bmp':
			case '.gif':
				await this.artSvc.addArtwork(resource_id);
				break;
		}
	}

	async addMedia(path: string, fh: fs.promises.FileHandle, owner_user_id: string, source_resource_id: string): Promise<MediaSQL | null> {
		const resource = this.rsrcSvc.createResource(owner_user_id);

		if (!resource)
		{
			return null;
		}

		const media: MediaSQL = {
			resource_id: resource.resource_id,
			source_resource_id: source_resource_id,
			path,
			size: (await fh.stat()).size,
			mime_type: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Media
		(
			resource_id,
			source_resource_id,
			path,
			size,
			mime_type
		)
		VALUES
		(
			$resource_id,
			$source_resource_id,
			$path,
			$size,
			$mime_type
		)
		`).run(media).changes > 0;

		if (success)
		{
			await this.mediaParser(media);
			
			return this.getMediaByID(media.resource_id);
		}
			
		return null;
	}

	removeMedia(resource_id: string): boolean {
		return this.rsrcSvc.removeResource(resource_id);
	}
}