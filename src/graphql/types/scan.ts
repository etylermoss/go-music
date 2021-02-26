/* 3rd party imports */
import { ObjectType, Field, ID, Int } from 'type-graphql';

@ObjectType()
export class ScanGQL {
    @Field(_type => ID)
    scanID: string;

    @Field(_type => Date)
    startTime: Date;

    /* following fields may be null if scan not completed */

    @Field(_type => Date, {nullable: true})
    endTime?: Date | null;

    @Field(_type => Int, {nullable: true})
    changesAdd?: number | null;

    @Field(_type => Int, {nullable: true})
    changesRemove?: number | null;
}