/* 3rd party imports */
import fs from 'fs';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

export interface SourceSQL {
	resource_id: string;
    name: string;
    path: string;
    xml_tree: string | null;
}

@Service('source.service')
export class SourceService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	/** Retrieves Source resource, searching for it by resource_id.
	 */
	getSourceByID(resource_id: string): SourceSQL | null {
		const source = this.dbSvc.prepare(`
		SELECT resource_id, name, path, xml_tree
		FROM Source
		WHERE resource_id = $resource_id
		`).get({resource_id}) as SourceSQL | undefined;

		return source || null;
	}

	/** Retrieve all Sources.
	 */
	getAllSources(): SourceSQL[] | null {
		const sources = this.dbSvc.prepare(`
		SELECT resource_id, name, path, xml_tree
		FROM Source
		`).all() as SourceSQL[];

		return sources.length > 0 ? sources : null;
	}

	/** Add a new source, returns the source if successful.
	 *  Does not automatically scan.
	 */
	// TODO: check source in not sub/superdirectory of existing source
	async addSource(name: string, path: string, owner_user_id: string): Promise<SourceSQL | null> {
		try {
			await fs.promises.access(path, fs.constants.R_OK);
		} catch (err) {
			console.error('Cannot access this directory: ', err);
			return null;
		}

		const resource = this.rsrcSvc.createResource(owner_user_id);

		if (!resource)
			return null;

		const source: SourceSQL = {
			resource_id: resource.resource_id,
			name,
			path,
			xml_tree: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Source (resource_id, name, path)
		VALUES ($resource_id, $name, $path);
		`).run(source).changes > 0;
		
		return success ? this.getSourceByID(source.resource_id) : null;
	}

	/** Remove a source, returns success.
	 *  Also removes all resources associated with the source.
	 */
	removeSource(resource_id: string): boolean {
		// TODO: Are associated resources removed? Unsure of cascade effectiveness
		return this.rsrcSvc.removeResource(resource_id);
	}
}