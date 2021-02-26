/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { UserService } from '@/services/user';

/* 1st party imports */
import { generateRandomID } from '@/common';

export interface ResourceSQL {
	resource_id: string;
	owner_user_id: string;
}

@Service('resource.service')
export class ResourceService {

	@Inject('database.service')
	private dbSvc: DatabaseService;
	
	@Inject('user.service')
	private userSvc: UserService;
	
	getResourceByID(resource_id: string): ResourceSQL | null {
		const resource = this.dbSvc.prepare(`
		SELECT 
			resource_id,
			owner_user_id
		FROM Resource
		WHERE resource_id = $resource_id
		`).get({resource_id}) as ResourceSQL | undefined;

		return resource ?? null;
	}

	/** Create a new resource. Returns null if the owner user_id does
	 *  not exist.
	 */
	createResource(owner_user_id: string): ResourceSQL | null {
		if (!this.userSvc.getUserByID(owner_user_id))
			return null;

		const resource: ResourceSQL = {
			resource_id: generateRandomID(),
			owner_user_id,
		};

		this.dbSvc.prepare(`
		INSERT INTO Resource (resource_id, owner_user_id)
		VALUES ($resource_id, $owner_user_id)
		`).run(resource);

		return resource;
	}
	
	
	/** Remove a resource, returns success.
	 *  Associated resources are removed.
	 */
	removeResource(resource_id: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM Resource
		WHERE resource_id = $resource_id
		`).run({resource_id}).changes > 0;
	}
}