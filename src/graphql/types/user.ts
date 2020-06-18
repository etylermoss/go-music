/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class UserDetails {
	@Field()
	email: string;

	@Field()
	real_name: string;
}

@ObjectType()
export class User {
	@Field(_type => ID)
	user_id: string;

	@Field()
	username: string;

	@Field({nullable: true})
	adminPriority?: number;
	
	@Field(_type => UserDetails, {nullable: true})
	details?: UserDetails;
}