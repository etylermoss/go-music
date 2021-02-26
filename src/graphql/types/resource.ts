/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ResourceGQL {
	@Field(_type => ID)
	resourceID: string;

	@Field(_type => ID)
	ownerUserID: string;
}