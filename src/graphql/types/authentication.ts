/* 3rd party imports */
import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class AuthResponse {
	@Field()
	success: boolean;
}