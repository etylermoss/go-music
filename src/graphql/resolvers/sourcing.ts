/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Root, Ctx } from 'type-graphql';
import { Inject } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';

/* 1st party imports - Services */
import { LoggerService } from '@/services/logger';
import { SourcingService } from '@/services/sourcing';
import { UserService } from '@/services/user';
import { AdminService } from '@/services/admin';
import { AccessControlService, Operations } from '@/services/access-control';

/* 1st party imports - GraphQL types & inputs */
import { Source } from '@/graphql/types/sourcing';

@Resolver(_of => Source)
export default class SourceResolver implements ResolverInterface<Source> {

	@Inject('logger.service')
	logSvc: LoggerService;

	@Inject('user.service')
	userSvc: UserService;
	
	@Inject('sourcing.service')
	sourcingSvc: SourcingService;

	@Inject('admin.service')
	adminSvc: AdminService;
	
	@Inject('access-control.service')
	aclSvc: AccessControlService;

	/** @typegraphql Field date object specifying when the last scan was.
	 */
	@FieldResolver({nullable: true})
	scan_previous(@Root() root: Source): Date | null {
		return root.scan_previous_timestamp ? new Date(root.scan_previous_timestamp * 1000) : null;
	}

	/** @typegraphql Query a source, must have permissions to access to it.
	 */
	@AccessControl('READ', 'resource_id')
	@Query(_returns => Source, {nullable: true})
	source(@Arg('resource_id') resource_id: string): Source {
		return this.sourcingSvc.getSourceByID(resource_id);
	}
	
	/** @typegraphql Query all sources, returns those which the user has
	 *  permission to access.
	 */
	@Query(_returns => [Source], {nullable: true})
	sources(@Ctx() ctx: Context): Source[] | null {
		const sources = this.sourcingSvc.getAllSources();
		if (sources) {
			const allowedSources = sources.reduce<Source[]>((acc, source) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.user_id, source.resource_id);
				if (level >= Operations.READ) {
					acc.push(source);
				}
				return acc;
			}, []);
			return allowedSources.length ? allowedSources : null;
		}
		return null;
	}

	@Mutation(_returns => Source, {nullable: true})
	addSource(): Source | null {
		return;
	}

	@Mutation(_returns => Source, {nullable: true})
	removeSource(): Source | null {
		return;
	}

	@Mutation(_returns => Source, {nullable: true})
	scanSource(): Source | null {
		return;
	}
}