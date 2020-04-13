export interface DetailsValidation {
	regex: RegExp;
	minLength: number;
	maxLength: number;
}

export default {
	username: {
		/** Matches valid usernames:
		 *  3 or more characters,
		 *  Contains only a-z, A-Z, 0-9, _ and -.
		 */
		regex: /[^a-zA-Z0-9_-]/g,
		minLength: 3,
		maxLength: 24
	} as DetailsValidation,
	password: {
		/** Matches valid passwords:
		 *  5 or more characters,
		 *  Contains only a-z, A-Z, 0-9,
		 *  and most common special characters.
		 */
		regex: /[^a-zA-Z0-9`¬|!"€£$%^&*()_+\-=[\]{};'#:@~<>?,./\\]/g,
		minLength: 5,
		maxLength: 128
	} as DetailsValidation
};