/* 1st party imports - Object types / classes */
import { ResourceSQL } from '@/services/resource';
import { ResourceGQL } from '@/graphql/types/resource';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const resource_to_gql = <T extends ResourceSQL | null>(resource: T): T extends ResourceSQL ? ResourceGQL : null =>
{
	return resource ? {
		resource_id: resource.resource_id,
		owner_user_id: resource.owner_user_id,
	} as any : null;
};