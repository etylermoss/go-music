/* 3rd party imports */
import { randomBytes } from 'crypto';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';

export enum Operations { READ, WRITE, DELETE }
export type OperationsStrings = keyof typeof Operations;

interface Group {
	group_id: string;
	owner_user_id: string;
	name: string;
	description: string;
}

interface UserGroup {
	user_id: string;
	group_id: string;
}

interface ResourceGroup {
	resource_id: string;
	group_id: string;
	allowed_operations: Operations;
}

@Service('access-control.service')
export class AccessControlService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	getResourceAccessLevelForUser(user_id: string | null, target_resource_id: string): Operations | null {
		if (!user_id) return null;

		const resource = this.rsrcSvc.getResourceByID(target_resource_id);

		if (user_id === resource.owner_user_id) return Operations.DELETE;

		const sharedGroups: ResourceGroup[] = this.dbSvc.prepare(`
		SELECT
		(
			ResourceGroup.resource_id,
			ResourceGroup.group_id,
			ResourceGroup.allowed_operations
		)
		FROM ResourceGroup
		INNER JOIN UserGroup
			ON UserGroup.group_id = ResourceGroup.group_id
		WHERE ResourceGroup.resource_id = $resource_id
			AND UserGroup.user_id = $user_id
		`).all({
			user_id,
			resource_id: target_resource_id,
		});

		if (!sharedGroups.length) return null;

		return sharedGroups.reduce<Operations>((prev, current) => {
			return (current.allowed_operations > prev)
				? current.allowed_operations
				: prev;
		}, Operations.READ);
	}

	getUserAccessLevelForUser(user_id: string, target_user_id: string): Operations | null {
		return user_id === target_user_id ? Operations.DELETE : null;
	}

	getGroupAccessLevelForUser(user_id: string, target_group_id: string): Operations | null {
		const group = this.getGroupByID(target_group_id);

		if (group && user_id === group.owner_user_id)
			return Operations.DELETE;

		return Operations.READ;
	}

	/** Creates a new access group. If a group already exists by the same
	 *  name, then null is returned.
	 */
	createNewGroup(user_id: string, name: string, description: string): Group | null {
		const group_id = randomBytes(8).toString('base64');
		const result = this.dbSvc.prepare(`
		INSERT INTO Group
		(
			group_id,
			user_id,
			name,
			description
		)
		VALUES
		(
			$group_id,
			$user_id,
			$name,
			$description
		)
		`).run({
			group_id,
			user_id,
			name,
			description,
		});
		
		if (result.changes === 0) return null;
		
		return this.getGroupByID(group_id);
	}

	/** Retrieves an Access Group, searching for it by ID.
	 */
	getGroupByID(group_id: string): Group | null {
		return this.dbSvc.prepare(`
		SELECT
		(
			group_id,
			user_id,
			name,
			description
		)
		FROM Group
		WHERE group_id = $group_id
		`).get({group_id}) as Group;
	}

	/** Retrives an Access Group, searching for it by name.
	 */
	getGroupByName(name: string): Group | null {
		return this.dbSvc.prepare(`
		SELECT
		(
			group_id,
			user_id,
			name,
			description
		)
		FROM Group
		WHERE name = $name
		`).get({name}) as Group;
	}
}