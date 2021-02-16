/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Ctx, Root } from 'type-graphql';
import { Inject } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl, FieldAccessControl } from '@/graphql/decorators/access-control';

/* 1st party imports - Services */
import { UserService } from '@/services/user';
import { AdminService } from '@/services/admin';
import { AccessControlService, Operations } from '@/services/access-control';

/* 1st party imports - GraphQL types & inputs */
import { UserGQL, UserDetailsGQL } from '@/graphql/types/user';

/* 1st party imports - SQL object to GQL object converters */
import { user_to_gql, user_details_to_gql } from '@/graphql/sql_to_gql/user';

@Resolver(_of => UserGQL)
export default class UserResolver implements ResolverInterface<UserGQL> {

	@Inject('user.service')
	userSvc: UserService;

	@Inject('admin.service')
	adminSvc: AdminService;

	@Inject('access-control.service')
	aclSvc: AccessControlService;

	/** @typegraphql Query a user, must be logged in.
	 */
	@AccessControl()
	@Query(_returns => UserGQL, {nullable: true})
	user(@Arg('user_id') user_id: string): UserGQL | null {
		return user_to_gql(this.userSvc.getUserByID(user_id));
	}

	/** @typegraphql Query all users, must be logged in.
	 */
	@AccessControl()
	@Query(_returns => [UserGQL], {nullable: true})
	users(@Ctx() ctx: Context): UserGQL[] | null {
		const users_sql = this.userSvc.getAllUsers();
		let allowedUsers: UserGQL[] = [];

		if (users_sql)
		{
			allowedUsers = users_sql.reduce<UserGQL[]>((acc, user) => {
				const level = this.aclSvc.getUserAccessLevelForUser(ctx.user_id, user.user_id);
				if (level && level >= Operations.READ) {
					acc.push(user_to_gql(user));
				}
				return acc;
			}, []);
		}

		return allowedUsers;
	}

	/** @typegraphql If the user is an admin, this is their priority level
	 *  over other admins, otherwise it is null.
	 */
	@FieldResolver({nullable: true})
	adminPriority(@Root() root: UserGQL): number | null {
		return this.adminSvc.getAdminUserPriority(root.user_id);
	}

	/** @typegraphql Query a user's details, checking if permitted.
	 */
	@FieldAccessControl('READ', 'user_id')
	@FieldResolver(_returns => UserDetailsGQL, {nullable: true})
	details(@Root() root: UserGQL): UserDetailsGQL | null {
		return user_details_to_gql(this.userSvc.getUserDetails(root.user_id));
	}

	/** @typegraphql Delete a user, returns success.
	 */
	@AccessControl('DELETE', 'user_id')
	@Mutation({nullable: true})
	deleteUser(@Arg('user_id') user_id: string): boolean {
		return this.userSvc.deleteUser(user_id);
	}
}