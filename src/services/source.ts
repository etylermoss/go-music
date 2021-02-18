/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

export interface SourceSQL {
	resource_id: string;
	name: string;
	path: string;
}

const arePathsRelated = (path_lhs: string, path_rhs: string): boolean => {
	const left = path.relative(path_lhs, path_rhs).startsWith('..');
	const right = path.relative(path_rhs, path_lhs).startsWith('..');
	
	return !(left && right);
};

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
		SELECT resource_id, name, path
		FROM Source
		WHERE resource_id = $resource_id
		`).get({resource_id}) as SourceSQL | undefined;

		return source ?? null;
	}

	/** Retrieve all Sources.
	 */
	getAllSources(): SourceSQL[] {
		const sources = this.dbSvc.prepare(`
		SELECT resource_id, name, path
		FROM Source
		`).all() as SourceSQL[];

		return sources;
	}

	/** Add a new source, returns the source if successful.
	 *  Does not automatically scan.
	 */
	async addSource(name: string, path: string, owner_user_id: string): Promise<SourceSQL | null> {
		path = fs.realpathSync(path);

		const existing_sources = this.getAllSources();

		for (const existing_source of existing_sources)
		{
			if (arePathsRelated(path, existing_source.path))
				return null;
		}

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
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO Source (resource_id, name, path)
		VALUES ($resource_id, $name, $path)
		`).run(source).changes > 0;

		if (!success)
		{
			this.rsrcSvc.removeResource(resource.resource_id);
			return null;
		}
		
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