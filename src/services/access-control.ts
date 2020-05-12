/* 3rd party imports */
import { randomBytes } from 'crypto';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { LoggerService } from '@/services/logger';
import { DatabaseService } from '@/database';

export enum Operations { READ, WRITE, DELETE }
export type OperationsStrings = keyof typeof Operations;

interface AccessGroup {
	group_id: string;
	user_id: string;
	name: string;
	description: string;
}

interface UserAccessGroup {
	user_id: string;
	group_id: string;
	allowed_operations: Operations;
}

interface ResourceAccessGroup {
	resource_id: string;
	group_id: string;
	allowed_operations: Operations;
}

interface Resource {
	resource_id: string;
	user_id: string;
}

@Service('access-control.service')
export class AccessControlService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('logger.service')
	private logSvc: LoggerService;

	getResourceAccessLevelForUser(user_id: string, target_resource_id: string): Operations | null {
		const resource = this.getResourceByID(target_resource_id);
		if (user_id === resource.user_id) return Operations.DELETE;

		const sharedGroups: ResourceAccessGroup[] = this.dbSvc.prepare(`
		SELECT
			ResourceAccessGroups.resource_id,
			ResourceAccessGroups.group_id,
			ResourceAccessGroups.allowed_operations
		FROM ResourceAccessGroups
		INNER JOIN UserAccessGroups
			ON UserAccessGroups.group_id = ResourceAccessGroups.group_id
		WHERE ResourceAccessGroups.resource_id = $resource_id
			AND UserAccessGroups.user_id = $user_id
		`).all({
			user_id,
			resource_id: target_resource_id,
		});
		if (!sharedGroups.length) return null;
		return sharedGroups.reduce<Operations>((prev, current) => {
			return (current.allowed_operations > prev)
				? current.allowed_operations
				: prev;
		}, 0);
	}

	getUserAccessLevelForUser(user_id: string, target_user_id: string): Operations | null {
		if (user_id === target_user_id) return Operations.DELETE;
		return null;
	}

	getGroupAccessLevelForUser(user_id: string, target_group_id: string): Operations | null {
		if (user_id === this.getGroupByID(target_group_id).user_id) return Operations.DELETE;
		return Operations.READ;
	}

	getResourceByID(resource_id: string): Resource {
		return this.dbSvc.prepare(`
		SELECT resource_id, user_id
		FROM Resources
		WHERE resource_id = $resource_id
		`).get({resource_id}) as Resource;
	}

	/** Creates a new access group. If a group already exists by the same
	 *  name, then null is returned.
	 */
	createNewGroup(user_id: string, name: string, description: string): AccessGroup | null {
		const sqlCreateGroup = this.dbSvc.prepare(`
		INSERT INTO AccessGroups (group_id, user_id, name, description)
		VALUES ($group_id, $user_id, $name, $description)
		`);
		const group_id = randomBytes(8).toString('base64');
		try {
			sqlCreateGroup.run({
				group_id,
				user_id,
				name,
				description,
			});
		} catch {
			this.logSvc.log('WARN', `Could not create group '${name}', likely already exists.`);
			return null;
		}
		return this.getGroupByID(group_id);
	}

	/** Retrieves an Access Group, searching for it by ID.
	 */
	getGroupByID(group_id: string): AccessGroup | null {
		return this.dbSvc.prepare(`
		SELECT ( group_id, user_id, name, description )
		FROM AccessGroups
		WHERE group_id = $group_id
		`).get({group_id}) as AccessGroup;
	}

	/** Retrives an Access Group, searching for it by name.
	 */
	getGroupByName(name: string): AccessGroup | null {
		return this.dbSvc.prepare(`
		SELECT group_id, user_id, name, description
		FROM AccessGroups
		WHERE name = $name
		`).get({name}) as AccessGroup;
	}
}