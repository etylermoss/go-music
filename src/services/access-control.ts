/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { AdminService } from '@/services/admin';

/* 1st party imports */
import { generateRandomID } from '@/common';

export enum Operations { NONE, READ, WRITE, DELETE }
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

@Service()
export class AccessControlService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
		private adminSvc: AdminService,
	) {}

	/**
	 * Get access level on the target resource for the given user.
	 * TODO: Add exception for admin users
	 * @param userID ID of user
	 * @param targetResourceID ID of target resource
	 * @returns Allowed operations
	 */
	getResourceAccessLevelForUser(userID: string, targetResourceID: string): Operations {
		const resource = this.rsrcSvc.getResourceByID(targetResourceID);

		if (!resource) return Operations.NONE;

		if (userID === resource.ownerUserID) return Operations.DELETE;

		const sharedGroups: ResourceGroup[] = this.dbSvc.prepare(`
		SELECT
		(
			ResourceGroup.resourceID,
			ResourceGroup.groupID,
			ResourceGroup.allowedOperations
		)
		FROM
			ResourceGroup
		INNER JOIN UserGroup
			ON UserGroup.groupID = ResourceGroup.groupID
		WHERE
			ResourceGroup.resourceID = $resourceID
			AND UserGroup.userID = $userID
		`).all({
			resourceID: targetResourceID,
			userID,
		});

		if (!sharedGroups.length) return Operations.NONE;

		return sharedGroups.reduce<Operations>((prev, current) => {
			return (current.allowedOperations > prev)
				? current.allowedOperations
				: prev;
		}, Operations.READ);
	}

	/**
	 * Get access level on the target user for the given user.
	 * Basic user data (username) is public, this is only for private data,
	 * e.g. email.
	 * TODO: Verify below implementation is correct
	 * @param userID ID of user
	 * @param targetUserID ID of target user
	 * @returns Allowed operations
	 */
	getUserAccessLevelForUser(userID: string, targetUserID: string): Operations {
		const userAdmin = this.adminSvc.getAdminUserPriority(userID);
		const tUserAdmin = this.adminSvc.getAdminUserPriority(targetUserID);
	
		if (userAdmin && (tUserAdmin && userAdmin > tUserAdmin) || !tUserAdmin)
			return Operations.DELETE;

		return userID === targetUserID ? Operations.DELETE : Operations.NONE;
	}

	/**
	 * Get access level on the target group for the given user.
	 * Groups are public so will either return READ, or DELETE if the user
	 * is the owner of the group.
	 * TODO: Admin users should always be delete / depending on priority
	 * @param userID ID of user
	 * @param targetGroupID ID of target group
	 * @returns Allowed operations
	 */
	getGroupAccessLevelForUser(userID: string, targetGroupID: string): Operations {
		const group = this.getGroupByID(targetGroupID);

		if (group && userID === group.ownerUserID)
			return Operations.DELETE;

		return Operations.READ;
	}

	/**
	 * Create new access group.
	 * @param ownerUserID Owner of the group
	 * @param name Name of the group
	 * @param description Description of the group
	 * @returns Group
	 */
	createGroup(ownerUserID: string, name: string, description: string): Group | null {
		const groupID = generateRandomID();
		const result = this.dbSvc.prepare(`
		INSERT INTO Group
		(
			groupID,
			ownerUserID,
			name,
			description
		)
		VALUES
		(
			$groupID,
			$ownerUserID,
			$name,
			$description
		)
		`).run({
			groupID,
			ownerUserID,
			name,
			description,
		});
				
		return result.changes !== 0 ? this.getGroupByID(groupID) : null;
	}

	/**
	 * Retrieve an access group, search by groupID.
	 * @param groupID ID of group
	 * @returns Group
	 */
	getGroupByID(groupID: string): Group | null {
		return this.dbSvc.prepare(`
		SELECT
		(
			groupID,
			ownerUserID,
			name,
			description
		)
		FROM
			Group
		WHERE
			groupID = ?
		`).get(groupID) as Group | undefined ?? null;
	}
}