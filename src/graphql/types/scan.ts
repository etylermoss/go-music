/* 3rd party imports */
import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class ScanGQL {
    @Field(_type => ID)
    scan_id: string;

    @Field(_type => Date)
    start_timestamp: Date;

    /* following fields may be null if scan not completed */

    @Field(_type => Date, {nullable: true})
    end_timestamp?: Date | null;

    @Field(_type => Int, {nullable: true})
    changes_add?: number | null;

    @Field(_type => Int, {nullable: true})
    changes_remove?: number | null;
}