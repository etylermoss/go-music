/* 3rd party imports */
import { Resolver, Arg, Query, Mutation } from 'type-graphql';
import { Inject } from 'typedi';

/* 1st party imports */
import { AccessControl } from '@/graphql/access-control';

/* 1st party imports - Services */
import { LoggingService } from '@/logging';
import { UserService } from '@/database/services/user';

/* 1st party imports - GraphQL types */
import { User } from '@/graphql/types/user';

@Resolver()
export default class UserResolver {

	@Inject('user.service')
	userSvc: UserService;

	@Inject('logging.service')
	logSvc: LoggingService;

	/** @typegraphql Query a user and their details.
	 */
	@AccessControl('READ', 'user')
	@Query(_returns => User, {nullable: true})
	user(@Arg('user_id') user_id: string): User {
		return this.userSvc.getUserByID(user_id, true);
	}

	/** @typegraphql Delete a user from the application.
	 */
	@AccessControl('DELETE', 'user')
	@Mutation(_returns => User, {nullable: true})
	deleteUser(@Arg('user_id') user_id: string): User {
		const user = this.userSvc.getUserByID(user_id);
		return this.userSvc.deleteUser(user_id) ? user : null;
	}

}