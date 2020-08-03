/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

/* 1st party imports - GraphQL types & inputs */
import { Source } from '@/graphql/types/sourcing';

@Service('sourcing.service')
export class SourcingService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	/** Retrieves Source resource, searching for it by resource_id.
	 */
	getSourceByID(resource_id: string): Source | null {
		return this.dbSvc.prepare(`
		SELECT resource_id, name, path, xml_tree, scan_underway, scan_previous_timestamp
		FROM Source
		WHERE resource_id = $resource_id
		`).get({resource_id}) as Source || null;
	}

	// randomBytes, input, input, null, false, null

	/** Retrieves all Source resources, ideally there shouldn't be that
	 *  many.
	 */
	getAllSources(): Source[] | null {
		const sources = this.dbSvc.prepare(`
		SELECT resource_id, name, path, xml_tree, scan_underway, scan_previous_timestamp
		FROM Source
		`).all() as Source[];
		return sources.length ? sources : null;
	}

	addSource(name: string, path: string): Source | null {
		return;
	}
}