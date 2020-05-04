/* 3rd party imports */
import { ObjectType, Field, ID, Resolver, Arg, Ctx, Mutation, InputType, Query } from 'type-graphql';
import { Inject } from 'typedi';
import { CookieOptions } from 'express';

/* 1st party imports */
import { AuthenticationService } from '@/database';
import { Context } from '@/graphql';

@ObjectType()
class User {
	@Field(_type => ID)
	user_id: string;

	@Field()
	username: string;

	@Field()
	email: string;

	@Field()
	real_name: string;
}

@InputType()
class SignInInput implements Partial<User> {
	@Field()
	username: string;

	@Field()
	password: string;
}

@InputType()
class SignUpInput implements Partial<User> {
	@Field()
	username: string;

	@Field()
	password: string;

	@Field()
	email: string;

	@Field()
	real_name: string;
}

@ObjectType()
class AuthResponse {
	@Field()
	success: boolean;

	@Field({nullable: true})
	user?: User;
}

const cookieOptions: CookieOptions = {
	/* Prevent XSRF */
	sameSite: 'strict',
	/* 28 days (value multiplied by miliseconds in a day) */
	maxAge: 28 * 86400000,
	/* Prevent XSS from getting authToken */
	httpOnly: true,
};

@Resolver()
class UserResolver {

	/* Inject Authentication Service */
	@Inject('authentication.service')
	authSvc: AuthenticationService;

	/** @typegraphql Dummy query until more are added, as the root Query
	 *  must not be empty according to GraphQL spec.
	 */
	@Query(_returns => String)
	dummy(): string {
		return 'dummy';
	}

	/** @typegraphql Sign into the application, if the supplied credentials
	 *  are correct, the authToken httpOnly cookie is set. */
	@Mutation(_returns => AuthResponse)
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.authSvc.getUserByUsernameAndPassword(data.username, data.password);
		if (user) {
			ctx.res.cookie('authToken', this.authSvc.newAuthToken(user.user_id), cookieOptions);
			return {
				success: true,
				user: user,
			};
		}
		return {
			success: false,
			user: null,
		};
	}

	/** @typegraphql Sign out of the application, revoking authToken.
	 */
	@Mutation(_returns => AuthResponse)
	signOut(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		ctx.res.clearCookie('authToken');
		return {
			success: this.authSvc.removeAuthToken(token),
		};
	}

	/** @typegraphql Sign out of the application on all currently
	 *  authorized clients, including the client sending the request.
	 *  Required to sign in again.
	 */
	@Mutation(_returns => AuthResponse)
	signOutAll(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.authSvc.getUserByUsernameAndPassword(data.username, data.password);
		const user_id = this.authSvc.checkAuthToken(ctx.req.cookies['authToken']);
		if (user && user_id) {
			ctx.res.clearCookie('authToken');
			this.authSvc.removeAllAuthTokens(user_id);
			return {
				success: true,
			};
		}
		return {
			success: false,
		};
	}

	/** @typegraphql Sign up, creating a new user/account, and signing in
	 *  the user automatically.
	 */
	@Mutation(_returns => AuthResponse)
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.authSvc.createUser(data);

		if (user) ctx.res.cookie('authToken', this.authSvc.newAuthToken(user.user_id), cookieOptions);

		return {
			success: user ? true : false,
			user: user ? user : null,
		};
	}

	/** @typegraphql Check whether the client is signed in, ensures the
	 *  authToken cookie (httpOnly) is present in the database and
	 *  associated with a user.
	 */
	@Mutation(_returns => AuthResponse)
	isSignedIn(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		const user_id = token ? this.authSvc.checkAuthToken(token) : null;
		return {
			success: user_id ? true : false,
			user: user_id ? this.authSvc.getUserByID(user_id) : null,
		};
	}
}

export { User, SignUpInput };
export default UserResolver;