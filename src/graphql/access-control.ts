/* 3rd party imports */
import { Container } from 'typedi';
import { createMethodDecorator} from 'type-graphql';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AuthenticationService } from '@/database/services/authentication';
import { AccessControlService, Operations, OperationsStrings } from '@/database/services/access-control';

/*  Stop-gap until MichalLytek/type-graphql#629 is solved */

type TargetTypes = 'resource_id' | 'user_id' | 'group_id';

/** Decorator used to control access to GraphQL Queries and Mutations.
 *  If the user is not authorized, the return value of the object is null
 *  (thus it must be nullable in the schema).
 * 
 * 	@param requiredLevel Required level of access to get (or set) data.
 *  @param targetType Type of the object that the client is being checked against. 
 */
export const AccessControl = (
	requiredLevel?: OperationsStrings,
	targetTypeArg?: TargetTypes,
	fieldResolver: boolean = false,
): MethodDecorator => {
	return createMethodDecorator<Context>(async ({args, info, context, root}, next) => {
		const authSvc: AuthenticationService = Container.get('authentication.service');
		const aclSvc: AccessControlService = Container.get('access-control.service');

		/* If the user is not signed in, they're always unauthorized */
		const token = context.req.cookies['authToken'];
		const user_id = token ? authSvc.checkAuthToken(token) : null;
		if (!user_id) return null;
		if (!requiredLevel && !targetTypeArg) return next();

		/* Check that a resource id was passed to the decorator */
		const target_id = (fieldResolver ? root : args)[targetTypeArg];
		if (!target_id) {
			throw new Error(`Field ${info.fieldName} was not supplied with ${targetTypeArg} argument.`);
		}

		/* Get the access level the user has for the specified resource */
		let userLevel = null;
		switch (targetTypeArg) {
			case 'resource_id': userLevel = aclSvc.getResourceAccessLevelForUser(user_id, target_id); break;
			case 'user_id': userLevel = aclSvc.getUserAccessLevelForUser(user_id, target_id); break;
			case 'group_id': userLevel = aclSvc.getGroupAccessLevelForUser(user_id, target_id); break;
		}

		return userLevel && userLevel >= Operations[requiredLevel] ? next() : null;
	});
};

/** Decorator used to control access to GraphQL Fields (field resolvers).
 *  If the user is not authorized, the return value of the field is null
 *  (thus it must be nullable in the schema).
 * 
 * 	@param requiredLevel Required level of access to get (or set) data.
 *  @param targetType Type of the object that the client is being checked against. 
 */
export const FieldAccessControl = (
	requiredLevel?: OperationsStrings,
	targetTypeArg?: TargetTypes,
): MethodDecorator => {
	return AccessControl(requiredLevel, targetTypeArg, true);
};