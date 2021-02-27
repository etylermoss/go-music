/* 3rd party imports */
import { Resolver, Arg, Ctx, Mutation } from 'type-graphql';
import { Service } from 'typedi';
import { CookieOptions } from 'express';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AuthenticationService } from '@/services/authentication';
import { UserService } from '@/services/user';
import { AdminService } from '@/services/admin';

/* 1st party imports - GraphQL types & inputs */
import { UserGQL } from '@/graphql/types/user';
import { SignUpInput, SignInInput } from '@/graphql/inputs/authentication';

/* 1st party imports - SQL object to GQL object converters */
import { userToGQL, signUpToCreateUserSQL } from '@/graphql/sql-gql-conversion/user';

const authTokenCookie: CookieOptions = {
	sameSite: 'strict',
	maxAge: 28 * 86400000, /* 28 days */
	httpOnly: true,
};

@Service()
@Resolver()
export default class AuthResolver {

	constructor (
		private authSvc: AuthenticationService,
		private userSvc: UserService,
		private adminSvc: AdminService,
	) {}

	/** @typegraphql Sign up, creating a new user/account, and signing in
	 *  the user automatically. The first account created is automatically
	 *  set as an admin.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): UserGQL | null {
		if (this.userSvc.getUserByUsername(data.username))
			return null;

		const user = this.userSvc.createUser(signUpToCreateUserSQL(data));

		if (user)
		{
			if (this.adminSvc.getAdminCount() === 0)
				this.adminSvc.makeUserAdmin(user.userID);
			
			this.authUser(ctx, user.userID);
			return userToGQL(user);
		}

		return null;
	}

	/** @typegraphql Sign into the application, if the supplied credentials
	 *  are correct, the authToken httpOnly cookie is set.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): UserGQL | null {
		const user = this.userSvc.getUserByUsername(data.username);
		if (user && this.authSvc.comparePasswordToUser(user.userID, data.password)) {
			this.authUser(ctx, user.userID);
			return userToGQL(user);
		}
		// TODO: Log
		console.log(`Incorrect sign-in attempt from ${ctx.req.ip}.`);
		return null;
	}

	/** @typegraphql Check whether the client is signed in, ensures the
	 *  authToken cookie (httpOnly) is present in the database and
	 *  associated with a user.
	 */
	@Mutation(_returns => UserGQL, {nullable: true})
	isSignedIn(@Ctx() ctx: Context): UserGQL | null {
		return ctx.userID ? userToGQL(this.userSvc.getUserByID(ctx.userID)) : null;
	}

	/** @typegraphql Update the users password. Requires the client to
	 *  sign-in again (i.e provide username & password).
	 */
	@Mutation(_returns => Boolean)
	updatePassword(@Arg('data') data: SignInInput, @Ctx() ctx: Context): boolean {
		const user = this.userSvc.getUserByUsername(data.username);
		if (!user || !ctx.userID) return false;
		
		if (ctx.userID === user.userID && this.authSvc.comparePasswordToUser(user.userID, data.password))
		{
			this.authSvc.revokeAllAuthTokens(ctx.userID);
			this.authSvc.updateUserPassword(ctx.userID, data.password);
			this.authUser(ctx, user.userID);
			return true;
		}

		return false;
	}

	/** @typegraphql Sign out of the application, revoking authToken.
	 */
	@Mutation(_returns => Boolean)
	signOut(@Ctx() ctx: Context): boolean {
		return this.unAuthUser(ctx);
	}

	/** @typegraphql Sign out of the application on all currently
	 *  authorized clients, including the client sending the request.
	 *  Required to sign in again.
	 */
	@Mutation(_returns => Boolean)
	signOutAll(@Arg('data') data: SignInInput, @Ctx() ctx: Context): boolean {
		const user = this.userSvc.getUserByUsername(data.username);

		if (!user || !ctx.userID)
			return false;

		if (ctx.userID === user.userID && this.authSvc.comparePasswordToUser(user.userID, data.password))
			return this.unAuthUser(ctx, ctx.userID);
		
		return false;
	}

	/** Revokes a users authToken cookie, signing them out. If a userID is
	 *  passed, all the user's authTokens are revoked.
	 */
	private unAuthUser(ctx: Context, userID?: string): boolean {
		ctx.userID = null;
		ctx.res.clearCookie('authToken');
		if (userID)
			return this.authSvc.revokeAllAuthTokens(userID);
		else
			return this.authSvc.revokeAuthToken(ctx.req.cookies['authToken']);
	}

	/** Set context.userID, and generate a new authToken which is then
	 *  stored in a browser cookie (httpOnly). 
	 */
	private authUser(ctx: Context, userID: string): void {
		ctx.userID = userID;
		ctx.res.cookie('authToken', this.authSvc.newAuthToken(userID), authTokenCookie);
	}
}