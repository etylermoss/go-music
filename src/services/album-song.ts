/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

/* 1st party imports - SQL types */
import { SongSQL } from '@/services/song';
import { AlbumSQL } from '@/services/album';

@Service()
export class AlbumSongService {

	constructor (
		private dbSvc: DatabaseService,
	) {}
	
	/**
	 * Retrieve all songs in an album.
	 * @param resourceID ID of album
	 * @returns Song array
	 */
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

	/**
	 * Retrieve album the given song belongs to (if any).
	 * @param songMediaResourceID ID of song
	 * @returns Album
	 */
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

	/**
	 * Find if the given song is the last song in its respective album, if
	 * it is in one. Otherwise returns null.
	 * @param songMediaResourceID ID of song
	 * @returns ID of album
	 */
	isLastSongInAlbum(songMediaResourceID: string): string | null {
		const result = this.dbSvc.prepare(`
		SELECT
			COUNT(*) AS count,
			albumResourceID
		FROM
			AlbumSong
		WHERE
			albumResourceID =
				(
					SELECT
						albumResourceID
					FROM
						AlbumSong
					WHERE
						songMediaResourceID = ?
				)
		`).get(songMediaResourceID) as {count: number; albumResourceID: string} | undefined;

		return (result?.count && result.count <= 1) ? result.albumResourceID : null;
	}
	
	/**
	 * Add the given song to the given album.
	 * @param songMediaResourceID ID of song
	 * @param albumResourceID ID of album
	 * @returns Success of operation
	 */
	addSongToAlbum(songMediaResourceID: string, albumResourceID: string): boolean {
		return this.dbSvc.prepare(`
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
		`).run({
			songMediaResourceID,
			albumResourceID,
		}).changes > 0;
	}
}