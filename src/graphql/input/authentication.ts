/* 3rd party imports */
import { Field, InputType, ArgumentValidationError } from 'type-graphql';
import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
	Validate,
	length,
	Length
} from 'class-validator';

/* 1st party imports */
import { RegisterValidation, ValidatorTuple, ValidationCheck, Validator } from '@/graphql/input';

/* 1st party imports - GraphQL types */
import { UserDetails } from '@/graphql/types/user';

@RegisterValidation()
@ValidatorConstraint()
class Username implements ValidatorConstraintInterface {
	@ValidationCheck()
	length(text: string): ValidatorTuple {
		const valid = length(text, 3, 24);
		return [valid, !valid ? `Username must be between 3 and 24 characters long.` : null];
	}

	@ValidationCheck()
	characters(text: string): ValidatorTuple {
		const invalidChars = text.match(/[^a-zA-Z0-9_-]/g);
		return [!invalidChars, invalidChars
			? `Username contains these invalid characters: ' ${invalidChars.map(c => `${c} `)}'`
			: null
		];
	}

	validate(text: string): boolean {
		const [length] = this.length(text);
		const [characters] = this.characters(text);
		return length && characters;
    }

	defaultMessage(args: ValidationArguments): string {
		return `Text ${args.property} is too short or too long!`;
	}
}

@InputType()
export class SignInInput {
	@Field()
	@Validate(Username)
	username: string;

	@Field()
	password: string;
}

@InputType()
export class SignUpInput extends SignInInput {
	@Field(_type => UserDetails)
	details: UserDetails;
}