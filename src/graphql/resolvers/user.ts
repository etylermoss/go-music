/* 3rd party imports */
import { scryptSync } from 'crypto';
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

@InputType({ description: 'Sign in to user' })
class SignInInput implements Partial<User> {
	@Field()
	username: string;

	@Field()
	password: string;
}

@InputType({ description: 'Create new user'})
class SignUpInput {
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

	@Query(_returns => User)
	user(@Arg('username') username: string): User {
		return this.userDBS.getUserByUsername(username);
	}

	@Mutation(_returns => AuthResponse)
	signIn(@Arg('data') data: SignInInput, @Ctx() ctx: Context): AuthResponse {
		// TODO: Move password comparison logic to IoC service
		const user = this.userDBS.getUserByUsername(data.username);
		if (user) {
			const userPasswordData = this.userDBS.getUserPasswordData(user.user_id);
			const inputHash = scryptSync(data.password, userPasswordData.salt, 256);
			if (inputHash.equals(userPasswordData.hash)) {
				ctx.res.cookie('authToken', this.userDBS.newAuthToken(user.user_id), cookieOptions);
				return {
					success: true,
					user: user,
				};
			}
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

	signOutAll(@Ctx() ctx: Context): AuthResponse {
		// TODO: Check password, use SignInInput
		const token = ctx.req.cookies['authToken'];
		if (token) {
			ctx.res.clearCookie('authToken');
			this.userDBS.removeAllAuthTokens(token);
		}
		return {
			success: false,
		};
	}

	@Mutation(_returns => AuthResponse)
	signUp(@Arg('data') data: SignUpInput, @Ctx() ctx: Context): AuthResponse {
		const user = this.userDBS.createUser(data);

		if (!user) return {
			success: false,
			user: null,
		};

		ctx.res.cookie('authToken', this.userDBS.newAuthToken(user.user_id), cookieOptions);
		return {
			success: true,
			user: user,
		};
	}

	@Mutation(_returns => AuthResponse)
	isSignedIn(@Ctx() ctx: Context): AuthResponse {
		const token = ctx.req.cookies['authToken'];
		const user_id = token ? this.userDBS.checkAuthToken(token) : null;
		return {
			success: user_id ? true : false,
		};
	}
}

export { User, SignUpInput };
export default UserResolver;