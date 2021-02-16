/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ScanGQL {
    @Field(_type => ID)
    scan_id: string;

    @Field(_type => ID)
    source_resource_id: string;

    @Field(_type => Date)
    start_timestamp: Date;

    @Field(_type => Date, {nullable: true})
    end_timestamp?: Date | null;

    @Field(_type => Number, {nullable: true})
    changes?: number | null;
}