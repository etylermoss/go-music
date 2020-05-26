/* 3rd party imports */
import { Field, InputType } from 'type-graphql';
import { IsAlphanumeric, Length, Matches, ValidateNested } from 'class-validator';

/* 1st party imports - GraphQL types & inputs */
import { UserDetailsInput } from '@/graphql/inputs/user';

const Password = /^[a-zA-Z0-9`¬|!"€£$%^&*()_+\-=[\]{};'#:@~<>?,./\\]+$/;

@InputType()
export class SignInInput {
	@Field()
	@IsAlphanumeric()
	@Length(3, 24)
	username: string;

	@Field()
	@Length(8, 128)
	@Matches(Password, {
		message: `Password can only contain A-Z, 0-9, and most common special characters.`,
	})
	password: string;
}

@InputType()
export class SignUpInput extends SignInInput {
	@Field(_type => UserDetailsInput)
	@ValidateNested()
	details: UserDetailsInput;
}