/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { AdminService } from '@/services/admin';

/* 1st party imports */
import { generateRandomID } from '@/common';

export enum Operations { READ, WRITE, DELETE }
export type OperationsStrings = keyof typeof Operations;

interface Group {
	groupID: string;
	ownerUserID: string;
	name: string;
	description: string;
}

interface UserGroup {
	userID: string;
	groupID: string;
}

interface ResourceGroup {
	resourceID: string;
	groupID: string;
	allowedOperations: Operations;
}

@Service('access-control.service')
export class AccessControlService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	@Inject('admin.service')
	private adminSvc: AdminService;

	// TODO: add exception for admin users
	getResourceAccessLevelForUser(userID: string | null, targetResourceID: string): Operations | null {
		if (!userID) return null;

		const resource = this.rsrcSvc.getResourceByID(targetResourceID);

		if (!resource) return null;

		if (userID === resource.ownerUserID) return Operations.DELETE;

		const sharedGroups: ResourceGroup[] = this.dbSvc.prepare(`
		SELECT
		(
			ResourceGroup.resourceID,
			ResourceGroup.groupID,
			ResourceGroup.allowedOperations
		)
		FROM ResourceGroup
		INNER JOIN UserGroup
			ON UserGroup.groupID = ResourceGroup.groupID
		WHERE ResourceGroup.resourceID = $resourceID
			AND UserGroup.userID = $userID
		`).all({
			userID,
			resourceID: targetResourceID,
		});

		if (!sharedGroups.length) return null;

		return sharedGroups.reduce<Operations>((prev, current) => {
			return (current.allowedOperations > prev)
				? current.allowedOperations
				: prev;
		}, Operations.READ);
	}

	getUserAccessLevelForUser(userID: string, targetUserID: string): Operations | null {
		const userAdmin = this.adminSvc.getAdminUserPriority(userID);
		const tUserAdmin = this.adminSvc.getAdminUserPriority(targetUserID);
	
		// TODO: check below is correct
		if (userAdmin && (tUserAdmin && userAdmin > tUserAdmin) || !tUserAdmin)
			return Operations.DELETE;

		return userID === targetUserID ? Operations.DELETE : null;
	}

	getGroupAccessLevelForUser(userID: string, targetGroupID: string): Operations | null {
		const group = this.getGroupByID(targetGroupID);

		if (group && userID === group.ownerUserID)
			return Operations.DELETE;

		return Operations.READ;
	}

	/** Creates a new access group. If a group already exists by the same
	 *  name, then null is returned.
	 */
	createNewGroup(userID: string, name: string, description: string): Group | null {
		const groupID = generateRandomID();
		const result = this.dbSvc.prepare(`
		INSERT INTO Group
		(
			groupID,
			userID,
			name,
			description
		)
		VALUES
		(
			$groupID,
			$userID,
			$name,
			$description
		)
		`).run({
			groupID,
			userID,
			name,
			description,
		});
		
		if (result.changes === 0) return null;
		
		return this.getGroupByID(groupID);
	}

	/** Retrieves an Access Group, searching for it by ID.
	 */
	getGroupByID(groupID: string): Group | null {
		return this.dbSvc.prepare(`
		SELECT
		(
			groupID,
			userID,
			name,
			description
		)
		FROM Group
		WHERE groupID = $groupID
		`).get({groupID}) as Group;
	}

	/** Retrives an Access Group, searching for it by name.
	 */
	getGroupByName(name: string): Group | null {
		return this.dbSvc.prepare(`
		SELECT
		(
			groupID,
			userID,
			name,
			description
		)
		FROM Group
		WHERE name = $name
		`).get({name}) as Group;
	}
}