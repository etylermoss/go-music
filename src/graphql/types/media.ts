/* 3rd party imports */
import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class MediaGQL {
    @Field(_type => ID)
    resourceID: string;

    @Field(_type => ID)
    sourceResourceID: string;

    @Field(_type => String)
    path: string;

    @Field(_type => Int)
    size: number;

    @Field(_type => String, {nullable: true})
    mimeType: string | null;
}