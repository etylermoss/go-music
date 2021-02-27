/* 3rd party imports */
import { Container } from 'typedi';
import { createMethodDecorator } from 'type-graphql';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AccessControlService, Operations, OperationsStrings } from '@/services/access-control';

/* Stop-gap until MichalLytek/type-graphql#629 is solved */

type TargetTypes = 'resourceID' | 'userID' | 'groupID';

/** 
 * Decorator used to control access to GraphQL Objects. If the user is not
 * authorized, the return value of the object is null (thus it must be
 * nullable in the schema). If no arguments are passed, this simply checks
 * the user is logged in.
 * 
 * @param requiredLevel Required level of access to get (or set) data.
 * @param targetType Type of the object that the client is being checked against. 
 */
export const AccessControl = (
	requiredLevel?: OperationsStrings,
	targetTypeArg?: TargetTypes,
	fieldResolver: boolean = false,
): MethodDecorator => {
	return createMethodDecorator<Context>(async ({args, info, context, root}, next) => {
		const aclSvc: AccessControlService = Container.get('access-control.service');
		const userID = context.userID;

		if (!userID)
			return null;
		if (!requiredLevel && !targetTypeArg)
			return next();

		/* Check that targetTypeArg was given to the decorator */
		if (!requiredLevel || !targetTypeArg)
			throw new Error(`Parameters were not supplied to AccessControl decorator`);

		/* Check that a resource id was passed to the decorator */
		const targetID = (fieldResolver ? root : args)[targetTypeArg];
		if (!targetID)
			throw new Error(`Field ${info.fieldName} was not supplied with ${targetTypeArg} argument.`);

		/* Get the access level the user has for the specified resource / user / group */
		let userLevel = null;
		switch (targetTypeArg)
		{
			case 'resourceID': userLevel = aclSvc.getResourceAccessLevelForUser(userID, targetID); break;
			case 'userID': userLevel = aclSvc.getUserAccessLevelForUser(userID, targetID); break;
			case 'groupID': userLevel = aclSvc.getGroupAccessLevelForUser(userID, targetID); break;
		}

		return userLevel >= Operations[requiredLevel] ? next() : null;
	});
};

/** Decorator used to control access to GraphQL Objects. If the user is not
 *  authorized, the return value of the object is null (thus it must be
 *  nullable in the schema). If no arguments are passed, this simply checks
 *  the user is logged in.
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