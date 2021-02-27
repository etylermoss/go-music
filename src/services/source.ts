/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import { Service } from 'typedi';

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

@Service()
export class SourceService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
	) {}

	/**
	 * Retrieve a source, search by resourceID.
	 * @param resourceID ID of source
	 * @returns Source
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

	/**
	 * Retrieve all sources.
	 * @returns Source array
	 */
	getAllSources(): SourceSQL[] {
		return this.dbSvc.prepare(`
		SELECT resourceID, name, path
		FROM Source
		`).all() as SourceSQL[];
	}

	/**
	 * Create new source.
	 * The new source is not automatically scanned for media.
	 * @param name Name of the source
	 * @param path Filesystem path of the source
	 * @param ownerUserID Owner of the source
	 * @returns Source
	 */
	async createSource(name: string, path: string, ownerUserID: string): Promise<SourceSQL | null> {
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
			this.rsrcSvc.deleteResource(resource.resourceID);
			return null;
		}
		
		return success ? this.getSourceByID(resource.resourceID) : null;
	}

	/**
	 * Delete a source, search by resourceID.
	 * @param resourceID ID of source
	 * @returns Success of deletion
	 */
	deleteSource(resourceID: string): boolean {
		return this.rsrcSvc.deleteResource(resourceID);
	}
}