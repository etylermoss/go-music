/* 3rd party imports */
import { Field, InputType } from 'type-graphql';
import { IsEmail, Length, Matches } from 'class-validator';

const SingularSpace = /^\S+(?: \S+)*$/u;
const RealName = /^[a-zA-ZÀ-ÖØ-öø-ɏ\-' ]+$/u;

@InputType()
export class UserDetailsInput {
	@Field()
	@IsEmail()
	email: string;

	@Field()
	@Length(2, 50)
	@Matches(SingularSpace, {
		message: `Name cannot contain spaces on either end, or multiple in a row.`,
	})
	@Matches(RealName, { // TODO: waiting for https://github.com/validatorjs/validator.js/issues/1282
		message: `Name can only contain Latin characters, apostrophes, hyphens, and spaces.`,
	})
	realName: string;
}