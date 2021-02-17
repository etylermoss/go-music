/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

/* 1st party imports - GraphQL types & inputs */
import { ScanGQL } from '@/graphql/types/scan';

@ObjectType()
export class SourceGQL {
	@Field(_type => ID)
	resource_id: string;

	@Field()
    name: string;
    
    @Field()
    path: string;
}

@ObjectType()
export class SourceWithScansGQL extends SourceGQL {
    @Field(_type => [ScanGQL])
    scans: ScanGQL[];

    @Field()
    scan_underway: boolean;
}