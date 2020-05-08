/* 3rd party imports */
import { Inject, Container } from 'typedi';
import { createMethodDecorator} from 'type-graphql';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { LoggingService } from '@/logging';
import { AuthenticationService } from '@/database/services/authentication';
import { AccessControlService, Operations, OperationsStrings } from '@/database/services/access-control';

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

/** Decorator used to control access to GraphQL Fields, Mutations, and
 *  Queries. If the user is not authorized, the return value of the field
 *  is null (thus it must be nullable in the schema).
 * 
 * 	@param requiredLevel Required level of access to get (or set) data.
 *  @param targetType Type of the object that the client is being checked against. 
 */
export const AccessControl = (
	requiredLevel: OperationsStrings,
	targetType: 'resource' | 'user' | 'group',
): MethodDecorator => {
	return createMethodDecorator<Context>(async ({args, info, context}, next) => {
		const authSvc: AuthenticationService = Container.get('authentication.service');
		const aclSvc: AccessControlService = Container.get('access-control.service');

		/* If the user is not signed in, they're always unauthorized */
		const token = context.req.cookies['authToken'];
		const user_id = token ? authSvc.checkAuthToken(token) : null;
		if (!user_id) return null;

		let userLevel = null;
		switch (targetType) {
			case 'resource': {
				const target_resource_id = args['resource_id'];
				if (!target_resource_id) throw new MissingTargetIdError('resource_id', info.fieldName);
				userLevel = aclSvc.getResourceAccessLevelForUser(user_id, target_resource_id);
				break;
			}
			case 'user': {
				const target_user_id = args['user_id'];
				if (!target_user_id) throw new MissingTargetIdError('user_id', info.fieldName);
				userLevel = aclSvc.getUserAccessLevelForUser(user_id, target_user_id);
				break;
			}
			case 'group': {
				const target_group_id = args['group_id'];
				if (!target_group_id) throw new MissingTargetIdError('group_id', info.fieldName);
				userLevel = aclSvc.getGroupAccessLevelForUser(user_id, target_group_id);
				break;
			}
			default:
				throw new Error(`Incorrect Target '${targetType}' passed to Authorized decorator.`);
		}

		return userLevel && userLevel >= Operations[requiredLevel] ? next() : null;
	});
};