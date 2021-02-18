/* 3rd party imports */
import { Service, Inject, Container } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { MediaService } from '@/services/media';

export interface ArtworkSQL {
	media_resource_id: string;
}

@Service('artwork.service')
export class ArtworkService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	/* fix circular dependency crash */
	private get mediaSvc(): MediaService {
		return Container.get('media.service');
	}

	getArtworkByID(media_resource_id: string): ArtworkSQL | null {
		const artwork = this.dbSvc.prepare(`
		SELECT
			media_resource_id
		FROM
			Artwork
		WHERE
			media_resource_id = $media_resource_id
		`).get({media_resource_id}) as ArtworkSQL | undefined;

		return artwork ?? null;
	}

	getAllArtwork(source_resource_id?: string): ArtworkSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			Artwork.media_resource_id,
		FROM
			Artwork
		INNER JOIN
			Media
		ON
			Media.resource_id = Artwork.media_resource_id
		WHERE
			(
				($source_resource_id IS null)
				OR (Media.source_resource_id = $source_resource_id)
			)
		`).all({source_resource_id: source_resource_id ?? null}) as ArtworkSQL[];
	}

	addArtwork(media_resource_id: string): ArtworkSQL | null {
		const success = this.dbSvc.prepare(`
		INSERT INTO Artwork
		(
			media_resource_id
		)
		VALUES
		(
			$media_resource_id
		)
		`).run({media_resource_id}).changes > 0;

		return success ? this.getArtworkByID(media_resource_id) : null;
	}

	removeArtwork(media_resource_id: string): boolean {
		return this.mediaSvc.removeMedia(media_resource_id);
	}
}