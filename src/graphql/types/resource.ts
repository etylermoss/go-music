/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ResourceGQL {
	@Field(_type => ID)
	resource_id: string;

	@Field(_type => ID)
	owner_user_id: string;
}