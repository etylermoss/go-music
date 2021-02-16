/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
/* import { DatabaseService } from '@/database';
import { SourceService } from '@/services/source'; */

/* 1st party imports - Object types / classes */
import { SourceSQL } from '@/services/source';

/* 1st party imports */
/* import { extension_whitelist } from '@/common';
 */

@Service('media.service')
export class MediaService {

	/* 	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('source.service')
	private srcSvc: SourceService; */

	addMedia(name: string, path: string, source: SourceSQL): void {
		console.info(`addMedia(${name}, ${path}, ${source.name}): Adding media`);
	}

	removeMedia(name: string, path: string, source: SourceSQL): void {
		console.info(`removeMedia(${name}, ${path}, ${source.name}): Removing media`);
	}
}