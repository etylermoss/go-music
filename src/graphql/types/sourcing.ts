/* 3rd party imports */
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class Source {
	@Field(_type => ID)
	resource_id: string;

	@Field()
    name: string;
    
    @Field()
    path: string;

    @Field()
    xml_tree: string;

    @Field()
    scan_underway: boolean;

    @Field({nullable: true})
    scan_previous?: Date | null;
    
    scan_previous_timestamp: number | null;
}