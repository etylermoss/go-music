/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

/* 1st party imports - GraphQL types & inputs */
import { SongGQL } from '@/graphql/types/song';

@ObjectType()
export class AlbumGQL {
    @Field(_type => ID)
    resourceID: string;
    
    @Field(_type => String)
    name: string;

    @Field(_type => [SongGQL])
    songs: SongGQL[];
}