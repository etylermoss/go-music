/* 3rd party imports */
import { Service, Container } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface ArtworkSQL {
	mediaResourceID: string;
}

@Service()
export class ArtworkService {

	constructor (
		private dbSvc: DatabaseService,
	) {}
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get(MediaService);
	}

	/**
	 * Retrieve artwork, search by mediaResourceID.
	 * @param mediaResourceID ID of artwork
	 * @returns Artwork
	 */
	getArtworkByID(mediaResourceID: string): ArtworkSQL | null {
		const artwork = this.dbSvc.prepare(`
		SELECT
			mediaResourceID
		FROM
			Artwork
		WHERE
			mediaResourceID = $mediaResourceID
		`).get({mediaResourceID}) as ArtworkSQL | undefined;

		return artwork ?? null;
	}

	/**
	 * Retrieve all artwork.
	 * @param sourceResourceID Optional source ID to limit search to
	 * @returns Artwork array
	 */
	getAllArtwork(sourceResourceID?: string): ArtworkSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			Artwork.mediaResourceID,
		FROM
			Artwork
		INNER JOIN
			Media
		ON
			Media.resourceID = Artwork.mediaResourceID
		WHERE
			(
				($sourceResourceID IS null)
				OR (Media.sourceResourceID = $sourceResourceID)
			)
		`).all({sourceResourceID: sourceResourceID ?? null}) as ArtworkSQL[];
	}

	/**
	 * Create new artwork.
	 * @param mediaResourceID ID of the parent media supertype
	 * @returns Artwork
	 */
	createArtwork(mediaResourceID: string): ArtworkSQL | null {
		const success = this.dbSvc.prepare(`
		INSERT INTO Artwork
		(
			mediaResourceID
		)
		VALUES
		(
			$mediaResourceID
		)
		`).run({mediaResourceID}).changes > 0;

		return success ? this.getArtworkByID(mediaResourceID) : null;
	}

	/**
	 * Delete artwork, search by mediaResourceID.
	 * @param mediaResourceID ID of artwork
	 * @returns Success of deletion
	 */
	deleteArtwork(mediaResourceID: string): boolean {
		return this.mediaSvc.deleteMedia(mediaResourceID);
	}
}