/* 3rd party imports */
import { Resolver, Arg, Ctx, Mutation } from 'type-graphql';
import { Inject } from 'typedi';
import { CookieOptions } from 'express';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { LoggingService } from '@/logging';
import { AuthenticationService } from '@/database/services/authentication';
import { UserService } from '@/database/services/user';

/* 1st party imports - GraphQL types */
import { AuthResponse, SignUpInput, SignInInput } from '@/graphql/types/authentication';
import { User } from '@/graphql/types/user';

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

	@Inject('logging.service')
	logSvc: LoggingService;

	/** @typegraphql Sign up, creating a new user/account, and signing in
	 *  the user automatically.
	 */
	@Mutation(_returns => User, {nullable: true})
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): User {
		const user = this.authSvc.createUser(data);

		if (user) {
			ctx.res.cookie('authToken', this.authSvc.newAuthToken(user.user_id), authTokenCookie);
			return user;
		}
		return null;
	}

	/** @typegraphql Sign into the application, if the supplied credentials
	 *  are correct, the authToken httpOnly cookie is set.
	 */
	@Mutation(_returns => User, {nullable: true})
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): User {
		const user = this.userSvc.getUserByUsername(data.username, true);
		if (user && this.authSvc.comparePasswordToUser(user.user_id, data.password)) {
			ctx.res.cookie('authToken', this.authSvc.newAuthToken(user.user_id), authTokenCookie);
			return user;
		}
		this.logSvc.log('WARN', `Incorrect sign-in attempt from ${ctx.req.ip}.`);
		return null;
	}

	/** @typegraphql Check whether the client is signed in, ensures the
	 *  authToken cookie (httpOnly) is present in the database and
	 *  associated with a user.
	 */
	@Mutation(_returns => User, {nullable: true})
	isSignedIn(@Ctx() ctx: Context): User {
		const token = ctx.req.cookies['authToken'];
		const user_id = token ? this.authSvc.checkAuthToken(token) : null;
		return user_id ? this.userSvc.getUserByID(user_id, true) : null;
	}

	/** @typegraphql Update the users password. Requires the client to
	 *  sign-in again (i.e provide username & password).
	 */
	@Mutation(_returns => AuthResponse)
	updatePassword(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userSvc.getUserByUsername(data.username, true);
		const user_id = this.authSvc.checkAuthToken(ctx.req.cookies['authToken']);
		if (user_id && user && this.authSvc.comparePasswordToUser(user.user_id, data.password)) {
			this.authSvc.removeAllAuthTokens(user_id);
			this.authSvc.createOrUpdateUserPassword(user_id, data.password);
			ctx.res.cookie('authToken', this.authSvc.newAuthToken(user.user_id), authTokenCookie);
			return { success: true };
		}
		return { success: false };
	}

	/** @typegraphql Sign out of the application, revoking authToken.
	 */
	@Mutation(_returns => AuthResponse)
	signOut(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		ctx.res.clearCookie('authToken');
		return { success: this.authSvc.removeAuthToken(token) };
	}

	/** @typegraphql Sign out of the application on all currently
	 *  authorized clients, including the client sending the request.
	 *  Required to sign in again.
	 */
	@Mutation(_returns => AuthResponse)
	signOutAll(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userSvc.getUserByUsername(data.username, true);
		const user_id = this.authSvc.checkAuthToken(ctx.req.cookies['authToken']);
		if (user_id && user && this.authSvc.comparePasswordToUser(user.user_id, data.password)) {
			ctx.res.clearCookie('authToken');
			this.authSvc.removeAllAuthTokens(user_id);
			return { success: true };
		}
		return { success: false };
	}
}