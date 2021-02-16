/* 1st party imports - Object types / classes */
import { UserSQL, UserDetailsSQL } from '@/services/user';
import { UserGQL, UserDetailsGQL } from '@/graphql/types/user';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const user_to_gql = <T extends UserSQL | null>(user: T): T extends UserSQL ? UserGQL : null =>
{
	return user ? {
		user_id: user.user_id,
		username: user.username,
		adminPriority: null,
		details: null,
	} as any : null;
};

export const user_details_to_gql = <T extends UserDetailsSQL | null>(details: T): T extends UserDetailsSQL ? UserDetailsGQL : null =>
{
	return details ? {
		email: details.email,
		real_name: details.real_name,
	} as any : null;
};