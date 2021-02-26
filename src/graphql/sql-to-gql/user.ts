/* 1st party imports - Object types / classes */
import { UserSQL, UserDetailsSQL } from '@/services/user';
import { UserGQL, UserDetailsGQL } from '@/graphql/types/user';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const userToGQL = <T extends UserSQL | null>(user: T): T extends UserSQL ? UserGQL : null =>
{
	return user ? {
		userID: user.userID,
		username: user.username,
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