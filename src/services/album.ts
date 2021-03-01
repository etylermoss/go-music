/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { AlbumSongService } from '@/services/album-song';

/* 1st party imports - SQL types */
import { ResourceSQL } from '@/services/resource';

export interface AlbumSQL {
	resourceID: string;
	name: string;
}

@Service()
export class AlbumService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
		private albumSongSvc: AlbumSongService,
	) {}

	/**
	 * Retrieve an album, search by resourceID.
	 * @param resourceID ID of album
	 * @returns Album
	 */
	getAlbumByID(resourceID: string): AlbumSQL | null {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Album
		WHERE
			resourceID = ?
		`).get(resourceID) as AlbumSQL | undefined ?? null;
	}

	/**
	 * Retrieve an album, search by name.
	 * @param name Name of album
	 * @returns Album
	 */
	getAlbumByName(name: string): AlbumSQL | null {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Album
		WHERE
			name = ?
		`).get(name) as AlbumSQL | undefined ?? null;
	}
	
	/**
	 * Retrieve all albums.
	 * @returns Album array
	 */
	getAllAlbums(): AlbumSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Album
		`).all() as AlbumSQL[];
	}

	/**
	 * Adds the given song to the album, searching for it (album) by
	 * name. If the album does not exist, it is created.
	 * @param name Album name
	 * @param songMediaResourceID ID of song
	 * @param ownerUserID Owner of the new album (if created)
	 * @returns Album
	 */
	createOrAddToAlbum(name: string, songMediaResourceID: string, ownerUserID: string): AlbumSQL | null {
		const album = this.getAlbumByName(name);

		if (album) {
			const success = this.albumSongSvc.addSongToAlbum(songMediaResourceID, album.resourceID);

			return success ? this.getAlbumByID(album.resourceID) : null;
		} else {
			/* create new album statement */
			const createAlbum = this.dbSvc.prepare(`
			INSERT INTO Album
			(
				resourceID,
				name
			)
			VALUES
			(
				$resourceID,
				$name
			)
			`);

			/* create generic resource for the album */
			let resource: ResourceSQL | null;
			if (!(resource = this.rsrcSvc.createResource(ownerUserID)))
				return null;

			/* create the album */
			const successCreateAlbum = createAlbum.run({
				resourceID: resource.resourceID,
				name: name,
			}).changes > 0;

			/* add song to the new album */
			let successAddToAlbum: boolean = false;
			if (!successCreateAlbum || !(successAddToAlbum = this.albumSongSvc.addSongToAlbum(songMediaResourceID, resource.resourceID)))
				this.rsrcSvc.deleteResource(resource.resourceID);

			return successAddToAlbum ? this.getAlbumByID(resource.resourceID) : null;
		}
	}

	/**
	 * Delete an album, search by albumResourceID.
	 * @param albumResourceID ID of album
	 * @returns Success of deletion
	 */
	deleteAlbum(albumResourceID: string): boolean {		
		return this.rsrcSvc.deleteResource(albumResourceID);
	}
}