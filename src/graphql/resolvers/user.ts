/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Root } from 'type-graphql';
import { Inject } from 'typedi';

/* 1st party imports */
import { AccessControl, FieldAccessControl } from '@/graphql/access-control';

/* 1st party imports - Services */
import { LoggingService } from '@/logging';
import { UserService } from '@/database/services/user';

/* 1st party imports - GraphQL types */
import { User, UserDetails } from '@/graphql/types/user';

@Resolver(_of => User)
export default class UserResolver implements ResolverInterface<User> {

	@Inject('user.service')
	userSvc: UserService;

	@Inject('logging.service')
	logSvc: LoggingService;

	/** @typegraphql Query a user, must be logged in.
	 */
	@AccessControl()
	@Query(_returns => User, {nullable: true})
	user(@Arg('user_id') user_id: string): User {
		return this.userSvc.getUserByID(user_id);
	}

	/** @typegraphql Query a user's details, checking if permitted.
	 */
	@FieldAccessControl('READ', 'user_id')
	@FieldResolver(_returns => UserDetails, {nullable: true})
	details(@Root() root: User): UserDetails {
		return this.userSvc.getUserDetails(root.user_id);
	}

	/** @typegraphql Delete a user from the application.
	 */
	@AccessControl('DELETE', 'user_id')
	@Mutation(_returns => User, {nullable: true})
	deleteUser(@Arg('user_id') user_id: string): User {
		const user = this.userSvc.getUserByID(user_id);
		return this.userSvc.deleteUser(user_id) ? user : null;
	}

}