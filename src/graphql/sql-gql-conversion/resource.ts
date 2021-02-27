/* 1st party imports - Object types / classes */
import { ResourceSQL } from '@/services/resource';
import { ResourceGQL } from '@/graphql/types/resource';

// BUG: https://github.com/Microsoft/TypeScript/issues/13995, must cast to any

export const resourceToGQL = <T extends ResourceSQL | null>(resource: T): T extends ResourceSQL ? ResourceGQL : null =>
{
	return resource ? {
		resourceID: resource.resourceID,
		ownerUserID: resource.ownerUserID,
	} as any : null;
};