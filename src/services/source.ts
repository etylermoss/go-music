/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

export interface SourceSQL {
	resourceID: string;
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

	/** Retrieves Source resource, searching for it by resourceID.
	 */
	getSourceByID(resourceID: string): SourceSQL | null {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Source
		WHERE
			resourceID = ?
		`).get(resourceID) as SourceSQL | undefined ?? null;
	}

	/** Retrieve all Sources.
	 */
	getAllSources(): SourceSQL[] {
		return this.dbSvc.prepare(`
		SELECT resourceID, name, path
		FROM Source
		`).all() as SourceSQL[];
	}

	/** Add a new source, returns the source if successful.
	 *  Does not automatically scan.
	 */
	async addSource(name: string, path: string, ownerUserID: string): Promise<SourceSQL | null> {
		path = fs.realpathSync(path);

		const sources = this.getAllSources();

		for (const source of sources)
		{
			if (arePathsRelated(path, source.path))
				return null;
		}

		try {
			await fs.promises.access(path, fs.constants.R_OK);
		} catch (err) {
			console.error('Cannot access this directory: ', err);
			return null;
		}

		const resource = this.rsrcSvc.createResource(ownerUserID);

		if (!resource)
			return null;

		const success = this.dbSvc.prepare(`
		INSERT INTO Source
		(
			resourceID,
			name,
			path
		)
		VALUES
		(
			$resourceID,
			$name,
			$path
		)
		`).run({resourceID: resource.resourceID, name, path}).changes > 0;

		if (!success)
		{
			this.rsrcSvc.removeResource(resource.resourceID);
			return null;
		}
		
		return success ? this.getSourceByID(resource.resourceID) : null;
	}

	/** Remove a source, returns success.
	 *  Also removes all resources associated with the source.
	 */
	removeSource(resourceID: string): boolean {
		return this.rsrcSvc.removeResource(resourceID);
	}
}