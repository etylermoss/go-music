/* 3rd party imports */
import { Resolver, Arg, Query, Mutation, FieldResolver, ResolverInterface, Root, Ctx, Int } from 'type-graphql';
import { Service, Inject } from 'typedi';

/* 1st party imports */
import Context from '@/context';
import { AccessControl } from '@/graphql/decorators/access-control';
import { IsAdmin } from '@/graphql/decorators/admin';

/* 1st party imports - Services */
import { SourceService } from '@/services/source';
import { MediaService } from '@/services/media';
import { ScanService } from '@/services/scan';
import { UserService } from '@/services/user';
import { AccessControlService, Operations } from '@/services/access-control';
import { AdminService } from '@/services/admin';

/* 1st party imports - GraphQL types & inputs */
import { SourceGQL } from '@/graphql/types/source';
import { ScanGQL } from '@/graphql/types/scan';
import { CreateSourceInput } from '@/graphql/inputs/source';

/* 1st party imports - SQL object to GQL object converters */
import { sourceToGQL } from '@/graphql/sql-gql-conversion/source';
import { scanToGQL } from '@/graphql/sql-gql-conversion/scan';

@Service()
@Resolver(_of => SourceGQL)
export default class SourceResolver implements ResolverInterface<SourceGQL> {

	@Inject('user.service')
	userSvc: UserService;
	
	@Inject('source.service')
	srcSvc: SourceService;

	@Inject('media.service')
	mediaSvc: MediaService;

	@Inject('scan.service')
	scanSvc: ScanService;

	@Inject('admin.service')
	adminSvc: AdminService;
	
	@Inject('access-control.service')
	aclSvc: AccessControlService;

	@FieldResolver(_returns => Int)
	mediaCount(@Root() root: SourceGQL): number {
		return this.mediaSvc.getMediaCount(root.resourceID);
	}

	@FieldResolver(_returns => [ScanGQL])
	scans(@Root() root: SourceGQL): ScanGQL[] {
		const scans = this.scanSvc.getAllScans(root.resourceID);
		return scans ? scans.map<ScanGQL>(scan => scanToGQL(scan)) : [];
	}

	@FieldResolver()
	scanUnderway(@Root() root: SourceGQL): boolean {
		return this.scanSvc.scanUnderway(root.resourceID) ? true : false;
	}

	/** @typegraphql Query a source, must have permissions to access to it.
	 */
	@AccessControl('READ', 'resourceID')
	@Query(_returns => SourceGQL, {nullable: true})
	source(@Arg('resourceID') resourceID: string): SourceGQL | null {
		return sourceToGQL(this.srcSvc.getSourceByID(resourceID));
	}
	
	/** @typegraphql Query all sources, returns those which the user has
	 *  permission to access.
	 */
	@AccessControl()
	@Query(_returns => [SourceGQL], {nullable: true})
	sources(@Ctx() ctx: Context): SourceGQL[] {
		const sources = this.srcSvc.getAllSources();

		if (sources)
			return sources.reduce<SourceGQL[]>((acc, source) => {
				const level = this.aclSvc.getResourceAccessLevelForUser(ctx.userID!, source.resourceID);
				if (level >= Operations.READ)
					acc.push(sourceToGQL(source));
				return acc;
			}, []);

		return [];
	}

	/** @typegraphql Add a new source, must be an admin.
	 *  The source is not scanned automatically.
	 */
	@IsAdmin()
	@Mutation(_returns => SourceGQL, {nullable: true})
	async createSource(@Arg('data') data: CreateSourceInput, @Ctx() ctx: Context): Promise<SourceGQL | null> {
		return sourceToGQL(await this.srcSvc.createSource(data.name, data.path, ctx.userID!));
	}

	/** @typegraphql Remove a source, must be admin, returns success.
	 *  Also removes all resources associated with the source.
	 *  Must be admin.
	 */
	@IsAdmin()
	@Mutation(_returns => Boolean)
	async deleteSource(@Arg('resourceID') resourceID: string): Promise<boolean> {
		return this.srcSvc.deleteSource(resourceID);
	}

	/** @typegraphql Scans the given source, returns success.
	 *  Must be admin.
	 */
	// TODO: change to @AccessControl
	@IsAdmin()
	@Mutation(_returns => Boolean)
	async scanSource(@Arg('resourceID') resourceID: string): Promise<boolean> {
		const scan = await this.scanSvc.scanSource(resourceID);

		return scan ? true : false;
	}
}