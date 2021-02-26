/* 3rd party imports */
import { Service, Inject, Container } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface ArtworkSQL {
	mediaResourceID: string;
}

@Service('artwork.service')
export class ArtworkService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get('media.service');
	}

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

	addArtwork(mediaResourceID: string): ArtworkSQL | null {
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

	removeArtwork(mediaResourceID: string): boolean {
		return this.mediaSvc.removeMedia(mediaResourceID);
	}
}