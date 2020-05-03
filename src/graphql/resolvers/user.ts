/* 3rd party imports */
import { ObjectType, Field, ID, Resolver, Arg, Ctx, Mutation, InputType, Query } from 'type-graphql';
import { Inject } from 'typedi';
import { CookieOptions } from 'express';

/* 1st party imports */
import { UserService } from '@/database';
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

@Resolver(_of => User)
class UserResolver {

	/* Inject UserService Database Service */
	@Inject('user.service')
	userDBS: UserService;

	/* Dummy query until more are added, since root Query must not be empty */
	@Query(_returns => User)
	user(@Arg('username') username: string): User {
		return this.userDBS.getUserByUsername(username);
	}

	@Mutation(_returns => AuthResponse)
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userDBS.getUserByUsernameAndPassword(data.username, data.password);
		if (user) {
			ctx.res.cookie('authToken', this.userDBS.newAuthToken(user.user_id), cookieOptions);
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

	@Mutation(_returns => AuthResponse)
	signOut(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		ctx.res.clearCookie('authToken');
		return {
			success: this.userDBS.removeAuthToken(token),
		};
	}

	@Mutation(_returns => AuthResponse)
	signOutAll(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userDBS.getUserByUsernameAndPassword(data.username, data.password);
		const user_id = this.userDBS.checkAuthToken(ctx.req.cookies['authToken']);
		if (user && user_id) {
			ctx.res.clearCookie('authToken');
			this.userDBS.removeAllAuthTokens(user_id);
			return {
				success: true,
			};
		}
		return {
			success: false,
		};
	}

	@Mutation(_returns => AuthResponse)
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userDBS.createUser(data);

		if (user) ctx.res.cookie('authToken', this.userDBS.newAuthToken(user.user_id), cookieOptions);

		return {
			success: user ? true : false,
			user: user ? user : null,
		};
	}

	@Mutation(_returns => AuthResponse)
	isSignedIn(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		const user_id = token ? this.userDBS.checkAuthToken(token) : null;
		return {
			success: user_id ? true : false,
			user: user_id ? this.userDBS.getUserByID(user_id) : null,
		};
	}
}

export { User, SignUpInput };
export default UserResolver;