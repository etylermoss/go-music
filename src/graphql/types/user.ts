/* 3rd party imports */
import { ObjectType, Field, ID, InputType } from 'type-graphql';

@ObjectType()
@InputType('UserDetailsInput')
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
	
	@Field(_type => UserDetails, {nullable: true})
	details?: UserDetails;
}