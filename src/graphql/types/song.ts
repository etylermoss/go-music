/* 3rd party imports */
import { ObjectType, Field, ID, Int, Float } from 'type-graphql';

/* 1st party imports - GraphQL types & inputs */
import { MediaGQL } from '@/graphql/types/media';

const nullable = true;

@ObjectType()
export class SongGQL {
    @Field(_type => ID)
    mediaResourceID: string;

    @Field(_type => MediaGQL)
    media: MediaGQL;
    
    @Field(_type => String)
    title: string;
    
    @Field(_type => Int, {nullable})
    year: number | null;
    
    @Field(_type => Int, {nullable})
    trackNo: number | null;
    
    @Field(_type => Int, {nullable})
    trackOf: number | null;
    
    @Field(_type => Int, {nullable})
    diskNo: number | null;
    
    @Field(_type => Int, {nullable})
    diskOf: number | null;
    
    @Field(_type => String, {nullable})
    releaseFormat: string | null;
    
    @Field(_type => String, {nullable})
    releaseCountry: string | null;
    
    @Field(_type => Float, {nullable})
    duration: number | null;

    @Field(_type => String, {nullable})
    codec: string | null;
    
    @Field(_type => Boolean, {nullable})
    lossless: boolean | null;
}