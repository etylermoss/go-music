/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class SongGQL {
    @Field(_type => ID)
    media_resource_id: string;

    @Field(_type => ID)
    source_resource_id: string;

    @Field(_type => String)
    path: string;
}