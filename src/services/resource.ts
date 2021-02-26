/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { UserService } from '@/services/user';

/* 1st party imports */
import { generateRandomID } from '@/common';

export interface ResourceSQL {
	resourceID: string;
	ownerUserID: string;
}

@Service('resource.service')
export class ResourceService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	@Inject('user.service')
	private userSvc: UserService;
	
	getResourceByID(resourceID: string): ResourceSQL | null {
		const resource = this.dbSvc.prepare(`
		SELECT 
			resourceID,
			ownerUserID
		FROM
			Resource
		WHERE
			resourceID = ?
		`).get(resourceID) as ResourceSQL | undefined;

		return resource ?? null;
	}

	/** Create a new resource. Returns null if the owner userID does
	 *  not exist.
	 */
	createResource(ownerUserID: string): ResourceSQL | null {
		if (!this.userSvc.getUserByID(ownerUserID))
			return null;

		const resource: ResourceSQL = {
			resourceID: generateRandomID(),
			ownerUserID,
		};

		this.dbSvc.prepare(`
		INSERT INTO Resource
		(
			resourceID,
			ownerUserID
		)
		VALUES
		(
			$resourceID,
			$ownerUserID
		)
		`).run(resource);

		return resource;
	}
	
	
	/** Remove a resource, returns success.
	 *  Associated resources are removed.
	 */
	removeResource(resourceID: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM
			Resource
		WHERE
			resourceID = ?
		`).run(resourceID).changes > 0;
	}
}