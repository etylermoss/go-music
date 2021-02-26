/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

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

	@Field(_type => Number, {nullable: true})
	adminPriority: number | null;
	
	@Field(_type => UserDetailsGQL, {nullable: true})
	details: UserDetailsGQL | null;
}