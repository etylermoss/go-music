/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

export interface MediaSQL {
	resource_id: string;
	source_resource_id: string;
	file_full_path: string;
}

@Service('media.service')
export class MediaService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	getMediaByID(resource_id: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			file_full_path
		FROM
			Media
		WHERE
			resource_id = $resource_id
		`).get({resource_id}) as MediaSQL | undefined;

		return media ?? null;
	}

	getMediaByPath(file_full_path: string): MediaSQL | null {
		const media = this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			file_full_path
		FROM
			Media
		WHERE
			file_full_path = $file_full_path
		`).get({file_full_path}) as MediaSQL | undefined;

		return media ?? null;
	}

	// TODO: add comment explaining optional argument
	getAllMedia(source_resource_id?: string): MediaSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			resource_id,
			source_resource_id,
			file_full_path
		FROM
			Media
		WHERE
			(
				($source_resource_id IS null)
				OR (source_resource_id = $source_resource_id)
			)
		`).all({source_resource_id: source_resource_id ?? null}) as MediaSQL[];
	}

	addMedia(file_full_path: string, owner_user_id: string, source_resource_id: string): MediaSQL | null {
		const resource = this.rsrcSvc.createResource(owner_user_id);

		if (!resource)
			return null;

		const media: MediaSQL = {
			resource_id: resource.resource_id,
			source_resource_id: source_resource_id,
			file_full_path,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Media
		(
			resource_id,
			source_resource_id,
			file_full_path
		)
		VALUES
		(
			$resource_id,
			$source_resource_id,
			$file_full_path
		)
		`).run(media).changes > 0;

		return success ? this.getMediaByID(media.resource_id) : null;
	}

	removeMedia(resource_id: string): boolean {
		return this.rsrcSvc.removeResource(resource_id);
	}
}