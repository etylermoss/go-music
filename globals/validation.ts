export interface DetailsValidation {
	regex: RegExp;
	minLength: number;
	maxLength: number;
}

type Details = 'username' | 'password';

export default {
	username: {
		/** Matches valid usernames:
		 *  3 or more characters,
		 *  Contains only a-z, A-Z, 0-9, _ and -.
		 */
		regex: /[^a-zA-Z0-9_-]/g,
		minLength: 3,
		maxLength: 24
	},
	password: {
		/** Matches valid passwords:
		 *  5 or more characters,
		 *  Contains only a-z, A-Z, 0-9,
		 *  and most common special characters.
		 */
		regex: /[^a-zA-Z0-9`¬|!"€£$%^&*()_+\-=[\]{};'#:@~<>?,./\\]/g,
		minLength: 8,
		maxLength: 128
	}
} as Record<Details, DetailsValidation>;