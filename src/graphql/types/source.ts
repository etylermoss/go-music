/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

/* 1st party imports - GraphQL types & inputs */
import { ScanGQL } from '@/graphql/types/scan';

@ObjectType()
export class SourceGQL {
	@Field(_type => ID)
	resourceID: string;

	@Field()
    name: string;
    
    @Field()
    path: string;

    @Field(_type => [ScanGQL])
    scans: ScanGQL[];

    @Field()
    scanUnderway: boolean;
}