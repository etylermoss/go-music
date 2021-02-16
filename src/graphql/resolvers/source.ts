/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Root, Ctx } from 'type-graphql';
import { Inject } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';
import { IsAdmin } from '@/graphql/decorators/admin';

/* 1st party imports - Services */
import { SourceService } from '@/services/source';
import { ScanService } from '@/services/scan';
import { UserService } from '@/services/user';
import { AccessControlService, Operations } from '@/services/access-control';
import { AdminService } from '@/services/admin';

/* 1st party imports - GraphQL types & inputs */
import { SourceGQL, SourceWithScansGQL } from '@/graphql/types/source';
import { ScanGQL } from '@/graphql/types/scan';
import { AddSourceInput } from '@/graphql/inputs/source';

/* 1st party imports - SQL object to GQL object converters */
import { source_to_gql } from '@/graphql/sql_to_gql/source';
import { scan_to_gql } from '@/graphql/sql_to_gql/scan';

@Resolver(_of => SourceWithScansGQL)
export default class SourceResolver implements ResolverInterface<SourceWithScansGQL> {

	@Inject('user.service')
	userSvc: UserService;
	
	@Inject('source.service')
	srcSvc: SourceService;

	@Inject('scan.service')
	scanSvc: ScanService;

	@Inject('admin.service')
	adminSvc: AdminService;
	
	@Inject('access-control.service')
	aclSvc: AccessControlService;

	@FieldResolver(_returns => [ScanGQL])
	scans(@Root() root: SourceGQL): ScanGQL[] {
		const scans_sql = this.scanSvc.getScans(root.resource_id);
		return scans_sql ? scans_sql.map<ScanGQL>(scan => scan_to_gql(scan)) : [];
	}

	@FieldResolver()
	scan_underway(@Root() root: SourceGQL): boolean {
		return this.scanSvc.scanUnderway(root.resource_id);
	}

	/** @typegraphql Query a source, must have permissions to access to it.
	 */
	@AccessControl('READ', 'resource_id')
	@Query(_returns => SourceGQL, {nullable: true})
	source(@Arg('resource_id') resource_id: string): SourceGQL | null {
		return source_to_gql(this.srcSvc.getSourceByID(resource_id));
	}
	
	/** @typegraphql Query all sources, returns those which the user has
	 *  permission to access.
	 */
	@Query(_returns => [SourceGQL], {nullable: true})
	sources(@Ctx() ctx: Context): SourceGQL[] | null {
		if (!ctx.user_id) return null;

		const sources_sql = this.srcSvc.getAllSources();
		let allowedSources: SourceGQL[] = [];

		if (sources_sql)
		{
			allowedSources = sources_sql.reduce<SourceGQL[]>((acc, source) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.user_id, source.resource_id);
				if (level && level >= Operations.READ) {
					acc.push(source_to_gql(source));
				}
				return acc;
			}, []);
		}

		return allowedSources;
	}

	/** @typegraphql Add a new source, must be an admin.
	 *  The source is not scanned automatically.
	 */
	@IsAdmin()
	@Mutation(_returns => SourceGQL, {nullable: true})
	async addSource(@Arg('data') data: AddSourceInput, @Ctx() ctx: Context): Promise<SourceGQL | null> {
		const source_sql = await this.srcSvc.addSource(data.name, data.path, ctx.user_id!);
		return source_to_gql(source_sql);
	}

	/** @typegraphql Remove a source, must be admin, returns success.
	 *  Also removes all resources associated with the source.
	 *  Must be admin.
	 */
	@IsAdmin()
	@Mutation(_returns => Boolean)
	async removeSource(@Arg('resource_id') resource_id: string): Promise<boolean> {
		return await this.srcSvc.removeSource(resource_id);
	}

	/** @typegraphql Scans the given source, returns success.
	 *  Must be admin.
	 */
	@IsAdmin()
	@Mutation(_returns => Boolean)
	async scanSource(@Arg('resource_id') resource_id: string): Promise<boolean> {
		await this.scanSvc.scanSource(resource_id);

		return true;
	}
}