/* 3rd party imports */
import { Field, InputType } from 'type-graphql';
import { IsAlphanumeric, Length } from 'class-validator';

@InputType()
export class AddSourceInput {
    @Field()
    @IsAlphanumeric()
	@Length(3, 24)
    name: string;

    @Field()
    path: string;
}