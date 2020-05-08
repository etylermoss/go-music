/* 3rd party imports */
import { ObjectType, Field, InputType } from 'type-graphql';

/* 1st party imports - GraphQL types */
import { UserDetails } from '@/graphql/types/user';

@ObjectType()
export class AuthResponse {
	@Field()
	success: boolean;
}

@InputType()
export class SignInInput {
	@Field()
	username: string;

	@Field()
	password: string;
}

@InputType()
export class SignUpInput extends SignInInput {
	@Field(_type => UserDetails)
	details: UserDetails;
}