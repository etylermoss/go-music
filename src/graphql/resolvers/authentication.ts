/* 3rd party imports */
import { Resolver, Arg, Ctx, Mutation } from 'type-graphql';
import { Inject } from 'typedi';
import { CookieOptions } from 'express';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AuthenticationService } from '@/services/authentication';
import { UserService } from '@/services/user';
import { AdminService } from '@/services/admin';

/* 1st party imports - GraphQL types & inputs */
import { AuthResponse } from '@/graphql/types/authentication';
import { UserGQL } from '@/graphql/types/user';
import { SignUpInput, SignInInput } from '@/graphql/inputs/authentication';

/* 1st party imports - SQL object to GQL object converters */
import { user_to_gql } from '@/graphql/sql_to_gql/user';

const authTokenCookie: CookieOptions = {
	/* Prevent XSRF */
	sameSite: 'strict',
	/* 28 days (value multiplied by miliseconds in a day) */
	maxAge: 28 * 86400000,
	/* Prevent XSS from getting authToken */
	httpOnly: true,
};

@Resolver()
export default class AuthResolver {
	
	@Inject('authentication.service')
	authSvc: AuthenticationService;

	@Inject('user.service')
	userSvc: UserService;

	@Inject('admin.service')
	adminSvc: AdminService;

	/** @typegraphql Sign up, creating a new user/account, and signing in
	 *  the user automatically. The first account created is automatically
	 *  set as an admin.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): UserGQL | null {
		if (this.userSvc.getUserByUsername(data.username))
			return null;

		const user = this.authSvc.createUser(data);

		if (user)
		{
			if (this.adminSvc.getAdminCount() === 0)
				this.adminSvc.makeUserAdmin(user.user_id);
			
			this.authUser(ctx, user.user_id);
			return user_to_gql(user);
		}

		return null;
	}

	/** @typegraphql Sign into the application, if the supplied credentials
	 *  are correct, the authToken httpOnly cookie is set.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): UserGQL | null {
		const user = this.userSvc.getUserByUsername(data.username);
		if (user && this.authSvc.comparePasswordToUser(user.user_id, data.password)) {
			this.authUser(ctx, user.user_id);
			return user_to_gql(user);
		}
		// TODO: Logging service here
		console.log(`Incorrect sign-in attempt from ${ctx.req.ip}.`);
		return null;
	}

	/** @typegraphql Check whether the client is signed in, ensures the
	 *  authToken cookie (httpOnly) is present in the database and
	 *  associated with a user.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	isSignedIn(@Ctx() ctx: Context): UserGQL | null {
		return ctx.user_id ? user_to_gql(this.userSvc.getUserByID(ctx.user_id)) : null;
	}

	/** @typegraphql Update the users password. Requires the client to
	 *  sign-in again (i.e provide username & password).
	 */
	@Mutation(_returns => AuthResponse)
	updatePassword(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userSvc.getUserByUsername(data.username);
		if (!user || !ctx.user_id) return { success: false };
		
		if (ctx.user_id === user.user_id && this.authSvc.comparePasswordToUser(user.user_id, data.password))
		{
			this.authSvc.revokeAllAuthTokens(ctx.user_id);
			this.authSvc.updateUserPassword(ctx.user_id, data.password);
			this.authUser(ctx, user.user_id);
			return { success: true };
		}

		return { success: false };
	}

	/** @typegraphql Sign out of the application, revoking authToken.
	 */
	@Mutation(_returns => AuthResponse)
	signOut(@Ctx() ctx: Context): AuthResponse {
		return { success: this.unAuthUser(ctx) };
	}

	/** @typegraphql Sign out of the application on all currently
	 *  authorized clients, including the client sending the request.
	 *  Required to sign in again.
	 */
	@Mutation(_returns => AuthResponse)
	signOutAll(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userSvc.getUserByUsername(data.username);

		if (!user || !ctx.user_id)
			return { success: false };

		if (ctx.user_id === user.user_id && this.authSvc.comparePasswordToUser(user.user_id, data.password))
			return { success: this.unAuthUser(ctx, ctx.user_id) };
		
		return { success: false };
	}

	/** Revokes a users authToken cookie, signing them out. If a user_id is
	 *  passed, all the user's authTokens are revoked.
	 */
	private unAuthUser(ctx: Context, user_id?: string): boolean {
		ctx.user_id = null;
		ctx.res.clearCookie('authToken');
		if (user_id)
			return this.authSvc.revokeAllAuthTokens(user_id);
		else
			return this.authSvc.revokeAuthToken(ctx.req.cookies['authToken']);
	}

	/** Set context.user_id, and generate a new authToken which is then
	 *  stored in a browser cookie (httpOnly). 
	 */
	private authUser(ctx: Context, user_id: string): void {
		ctx.user_id = user_id;
		ctx.res.cookie('authToken', this.authSvc.newAuthToken(user_id), authTokenCookie);
	}
}