/* 3rd party imports */
import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class UserDetailsGQL {
	@Field()
	email: string;

	@Field()
	realName: string;
}

@ObjectType()
export class UserGQL {
	@Field(_type => ID)
	userID: string;

	@Field()
	username: string;
	
	@Field(_type => UserDetailsGQL)
	details: UserDetailsGQL;

	@Field(_type => Int, {nullable: true})
	adminPriority: number | null;
}