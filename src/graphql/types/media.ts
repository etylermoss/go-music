/* 3rd party imports */
import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class MediaGQL {
    @Field(_type => ID)
    resource_id: string;

    @Field(_type => ID)
    source_resource_id: string;

    @Field(_type => String)
    path: string;

    @Field(_type => Int)
    size: number;

    @Field(_type => String, {nullable: true})
    mime_type: string | null;
}