/* 3rd party imports */
import { ObjectType, Field, ID, Resolver, Query, Arg } from 'type-graphql';

const userdata: User[] = [
	{ id: 'abc', username: 'Owley', firstName: 'Eden', lastName: 'Tyler-Moss' },
	{ id: 'xtc', username: 'Cereal' },
];

@ObjectType()
class User {
	@Field(_type => ID)
	id: string;

	@Field()
	username: string;

	@Field({ nullable: true })
	firstName?: string;

	@Field({ nullable: true })
	lastName?: string;

	@Field({ nullable: true })
	fullName?(): string {
		return this.firstName && this.lastName ? `${this.firstName} ${this.lastName}` : null;
	}
}

@Resolver(_of => User)
export default class UserResolver {
	@Query(_returns => User)
	user(@Arg('id') id: string): User {
		const user = userdata.find(el => el.id === id);
		if (user === undefined) {
			throw 401;
		}
		return user;
	}

	@Query(_returns => [User])
	users(): User[] {
		return userdata;
	}
}