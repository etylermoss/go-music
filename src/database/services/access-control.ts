/* 3rd party imports */
import { randomBytes } from 'crypto';
import { Service, Inject, Container } from 'typedi';
import { createMethodDecorator } from 'type-graphql';

/* 1st party imports */
import Context from '@/context';
import { LoggingService } from '@/logging';
import { DatabaseService } from '@/database';
import { AuthenticationService } from '@/database/services/authentication';

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

class MissingTargetIdError extends Error {

	@Inject()
	logSvc: LoggingService;

	constructor(targetId: string, resolverFieldName: string) {
		const message = `Resolver '${resolverFieldName}' was not supplied with '${targetId}' argument.`;
		super(message);
		this.logSvc.log('ERROR', message);
		this.name = 'MissingTargetIdError';
	}
}

type AccessControlTypes = 'resource' | 'user' | 'group';

/** Decorator used to control access to GraphQL Fields, Mutations, and
 *  Queries. If the user is not authorized, the return value of the field
 *  is null (thus it must be nullable in the schema).
 * 
 * 	@param requiredLevel Required level of access to get (or set) data.
 *  @param targetType The type of the object that the client is being checked against. 
 */
export const AccessControl = (
	requiredLevel: OperationsStrings,
	targetType: AccessControlTypes,
): MethodDecorator => {
	return createMethodDecorator<Context>(async ({args, info, context}, next) => {
		const authSvc: AuthenticationService = Container.get('authentication.service');
		const operationLevel = Operations[requiredLevel];
		const token = context.req.cookies['authToken'];
		const user_id = token ? authSvc.checkAuthToken(token) : null;

		if (!requiredLevel && !targetType) return user_id !== null;
		if (!user_id) return null;

		const acSvc: AccessControlService = Container.get('access-control.service');

		let userLevel = null;
		switch (targetType) {
			case 'resource': {
				const target_resource_id = args['resource_id'];
				if (!target_resource_id) throw new MissingTargetIdError('resource_id', info.fieldName);
				userLevel = acSvc.getResourceAccessLevelForUser(user_id, target_resource_id);
				break;
			}
			case 'user': {
				const target_user_id = args['user_id'];
				if (!target_user_id) throw new MissingTargetIdError('user_id', info.fieldName);
				userLevel = acSvc.getUserAccessLevelForUser(user_id, target_user_id);
				break;
			}
			case 'group': {
				const target_group_id = args['group_id'];
				if (!target_group_id) throw new MissingTargetIdError('group_id', info.fieldName);
				userLevel = acSvc.getGroupAccessLevelForUser(user_id, target_group_id);
				break;
			}
			default:
				throw new Error(`Incorrect Target '${targetType}' passed to Authorized decorator.`);
		}

		return userLevel && userLevel >= operationLevel ? next() : null;
	});
};

@Service('access-control.service')
export class AccessControlService {

	@Inject('database.service')
	dbSvc: DatabaseService;

	@Inject('logging.service')
	logSvc: LoggingService;

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

	getGroupByName(name: string): AccessGroup | null {
		return this.dbSvc.prepare(`
		SELECT group_id, user_id, name, description
		FROM AccessGroups
		WHERE name = $name
		`).get({name}) as AccessGroup;
	}
}