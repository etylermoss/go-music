/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Root } from 'type-graphql';
import { Service, Inject } from 'typedi';

/* 1st party imports */
import { AccessControl, FieldAccessControl } from '@/graphql/decorators/access-control';
import { IsAdmin } from '@/graphql/decorators/admin';

/* 1st party imports - Services */
import { UserService } from '@/services/user';
import { AdminService } from '@/services/admin';

/* 1st party imports - GraphQL types & inputs */
import { UserGQL, UserDetailsGQL } from '@/graphql/types/user';

/* 1st party imports - SQL object to GQL object converters */
import { userToGQL, userDetailsToGQL } from '@/graphql/sql-gql-conversion/user';

@Service()
@Resolver(_of => UserGQL)
export default class UserResolver implements ResolverInterface<UserGQL> {

	@Inject('user.service')
	userSvc: UserService;

	@Inject('admin.service')
	adminSvc: AdminService;

	/** @typegraphql Query a user, must be logged in.
	 */
	@AccessControl()
	@Query(_returns => UserGQL, {nullable: true})
	user(@Arg('userID') userID: string): UserGQL | null {
		return userToGQL(this.userSvc.getUserByID(userID));
	}

	/** @typegraphql Query all users, must be an admin.
	 */
	@IsAdmin()
	@Query(_returns => [UserGQL], {nullable: true})
	users(): UserGQL[] {
		return this.userSvc.getAllUsers().map<UserGQL>(user => userToGQL(user));
	}

	/** @typegraphql If the user is an admin, this is their priority level
	 *  over other admins, otherwise it is null.
	 */
	@FieldResolver({nullable: true})
	adminPriority(@Root() root: UserGQL): number | null {
		return this.adminSvc.getAdminUserPriority(root.userID);
	}

	/** @typegraphql Query a user's details, checking if permitted.
	 */
	@FieldAccessControl('READ', 'userID')
	@FieldResolver(_returns => UserDetailsGQL, {nullable: true})
	details(@Root() root: UserGQL): UserDetailsGQL | null {
		return userDetailsToGQL(this.userSvc.getUserDetails(root.userID));
	}

	/** @typegraphql Delete a user, returns success.
	 */
	@AccessControl('DELETE', 'userID')
	@Mutation({nullable: true})
	deleteUser(@Arg('userID') userID: string): boolean {
		return this.userSvc.deleteUser(userID);
	}
}