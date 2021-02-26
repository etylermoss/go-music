/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

/* 1st party imports - GraphQL types & inputs */
import { MediaGQL } from '@/graphql/types/media';

@ObjectType()
export class SongGQL {
    @Field(_type => ID)
    media_resource_id: string;

    @Field(_type => MediaGQL)
    media: MediaGQL;
}