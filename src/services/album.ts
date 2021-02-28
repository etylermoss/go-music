/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

/* 1st party imports - SQL types */
import { SongSQL } from '@/services/song';

export interface AlbumSQL {
	resourceID: string;
	name: string;
}

@Service()
export class AlbumService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
	) {}

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
	
	getAllAlbums(): AlbumSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Album
		`).all() as AlbumSQL[];
	}
	
	getAlbumSongs(resourceID: string): SongSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			Song.*
		FROM
			Song
		INNER JOIN
			AlbumSong
		ON
			Song.mediaResourceID = AlbumSong.songMediaResourceID
		WHERE
			AlbumSong.albumResourceID = ?
		`).all(resourceID) as SongSQL[];
	}

	getSongAlbum(songMediaResourceID: string): AlbumSQL | null {
		return this.dbSvc.prepare(`
		SELECT
			Album.*
		FROM
			Album
		INNER JOIN
			AlbumSong
		ON
			Album.resourceID = AlbumSong.albumResourceID
		WHERE
			AlbumSong.songMediaResourceID = ?
		`).get(songMediaResourceID) as AlbumSQL | undefined ?? null;
	}

	createOrAddToAlbum(name: string, songMediaResourceID: string, ownerUserID: string): AlbumSQL | null {
		const album = this.getAlbumByName(name);

		/* associate song with album */
		const insertIntoAlbumSong = this.dbSvc.prepare(`
		INSERT INTO AlbumSong
		(
			songMediaResourceID,
			albumResourceID
		)
		VALUES
		(
			$songMediaResourceID,
			$albumResourceID
		)
		`);

		/* create new album */
		const insertIntoAlbum = this.dbSvc.prepare(`
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

		if (album) {
			const success = insertIntoAlbumSong.run({
				songMediaResourceID: songMediaResourceID,
				albumResourceID: album.resourceID,
			}).changes > 0;

			return success ? this.getAlbumByID(album.resourceID) : null;
		} else {
			const resource = this.rsrcSvc.createResource(ownerUserID);

			if (!resource)
				return null;

			const successAlbum = insertIntoAlbum.run({
				resourceID: resource.resourceID,
				name: name,
			}).changes > 0;

			let successAlbumSong: boolean;
			if (successAlbum) {
				successAlbumSong = insertIntoAlbumSong.run({
					songMediaResourceID,
					albumResourceID: resource.resourceID,
				}).changes > 0;
			} else {
				successAlbumSong = false;
				this.rsrcSvc.deleteResource(resource.resourceID);
			}

			return successAlbumSong ? this.getAlbumByID(resource.resourceID) : null;
		}
	}
}