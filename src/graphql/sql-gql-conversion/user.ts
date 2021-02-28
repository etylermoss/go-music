/* 1st party imports */
import { UserSQL, UserDetailsSQL, CreateUser } from '@/services/user';
import { UserGQL, UserDetailsGQL } from '@/graphql/types/user';
import { SignUpInput } from '@/graphql/inputs/authentication';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const userToGQL = <T extends UserSQL | null>(user: T): T extends UserSQL ? UserGQL : null =>
{
	return user ? {
		...user,
		adminPriority: null,
		details: null,
	} as any : null;
};

export const userDetailsToGQL = <T extends UserDetailsSQL | null>(details: T): T extends UserDetailsSQL ? UserDetailsGQL : null =>
{
	return details ? {
		email: details.email,
		realName: details.realName,
	} as any : null;
};

export const signUpToCreateUserSQL = < T extends SignUpInput | null>(signUpInput: T): T extends SignUpInput ? CreateUser : null =>
{
	return signUpInput ? {
		...signUpInput,
	} as any : null;
};