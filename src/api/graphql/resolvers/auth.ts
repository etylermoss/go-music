/* 3rd party imports */
import { ObjectType, Field, ID, Resolver, Query, Arg, Ctx, Mutation, InputType } from 'type-graphql';

const logindata: Login[] = [
	{ id: 'tux', username: 'Yamaha', password: 'verysecure123456' },
	{ id: 'arc', username: 'Mozart', password: 'mysecurepassword' },
];

@ObjectType()
class Login {
	@Field(_type => ID)
	id: string;

	@Field()
	username: string;

	@Field()
	password: string;
}

@InputType({ description: 'Set new password' })
class NewPasswordInput implements Partial<Login> {
	@Field()
	password: string;
}

@Resolver(_of => Login)
export default class LoginResolver {
	@Mutation(_returns => Login)
	newPassword(@Arg('id') id: string, @Arg('data') newPassword: NewPasswordInput): Login {
		const user = logindata.find(el => el.id === id);
		if (user === undefined) {
			throw 'User not found.';
		}
		user.password = newPassword.password;
		console.log(`${user.username}'s password has been changed.`);
		return user;
	}
	
	@Query(_returns => Login)
	login(@Arg('id') id: string): Login {
		const login = logindata.find(el => el.id === id);
		if (login === undefined) {
			throw 'User not found.';
		}
		return login;
	}
}