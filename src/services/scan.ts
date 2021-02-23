/* 3rd party imports */
import fs from 'fs';
import path from 'path';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { SourceService } from '@/services/source';
import { MediaService } from '@/services/media';

/* 1st party imports - SQL types */
import { SourceSQL } from '@/services/source';

/* 1st party imports */
import { extension_whitelist } from '@/services/media';

export interface ScanSQL {
	scan_id: string;
	source_resource_id: string;
	start_timestamp: number;
	end_timestamp: number | null;
	changes: number | null;
}

interface FlatDirOpts {
	skip_hidden?: boolean;
	extension_whitelist?: string[];
	access_constant?: number;
}

const flat_dir = (curr_path: string, options?: FlatDirOpts): string[] | null => {
	let files: fs.Dirent[];
	let acc: string[] = [];

	try {
		/* get array of dirents for current directory path */
		files = fs.readdirSync(curr_path, {withFileTypes: true});
	} catch {
		/* could not access files in directory, e.g permissions, not a dir etc. */
		return null;
	}

	for (const file of files)
	{
		const file_path = path.join(curr_path, file.name);
		const file_ext = path.extname(file_path).toLowerCase();

		/* ignore hidden files if specified */
		if (options?.skip_hidden && file.name.charAt(0) === '.')
			continue;

		/* check can access file with specified permission level */
		if (options?.access_constant)
		{
			try {
				fs.accessSync(file_path, options?.access_constant);
			} catch {
				continue;
			}
		}

		/* ignore non-whitelisted file extensions if specified */
		if (file.isFile() && extension_whitelist && !extension_whitelist.includes(file_ext))
			continue;

		/* finally push file to accumulator / recurse into dir */
		if (file.isFile())
			acc.push(file_path);
		else if (file.isDirectory())
			acc = acc.concat(flat_dir(file_path, options) ?? []);
	}

	return acc;
};

// TODO: Clean this service up
// TODO: If scan timestamps mismatch, prune media first, then populate (i.e start new scan)
@Service('scan.service')
export class ScanService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('resource.service')
	private rsrcSvc: ResourceService;

	@Inject('source.service')
	private srcSvc: SourceService;

	@Inject('media.service')
	private mediaSvc: MediaService;

	getScan(scan_id: string): ScanSQL | null {
		const scan = this.dbSvc.prepare(`
		SELECT scan_id source_resource_id start_timestamp end_timestamp changes
		FROM Scan
		WHERE scan_id = $scan_id
		`).get({scan_id}) as ScanSQL | undefined;

		return scan ?? null;
	}

	getAllScans(source_resource_id: string): ScanSQL[] | null {
		const scans = this.dbSvc.prepare(`
		SELECT scan_id source_resource_id start_timestamp end_timestamp changes
		FROM Scan
		WHERE source_resource_id = $source_resource_id
		`).all({source_resource_id}) as ScanSQL[];

		return scans.length > 0 ? scans : null;
	}

	getLatestScan(source_resource_id: string): ScanSQL | null {
		const scan = this.dbSvc.prepare(`
		SELECT scan_id source_resource_id start_timestamp end_timestamp changes
		FROM Scan
		WHERE source_resource_id = $source_resource_id
		ORDER BY start_timestamp DESC
		LIMIT 1
		`).get({source_resource_id}) as ScanSQL | undefined;

		return scan ?? null;
	}

	scanUnderway(source_resource_id: string): boolean {
		const latest_scan = this.getLatestScan(source_resource_id);

		if (!latest_scan || !latest_scan.end_timestamp)
			return true;
		
		return false;
	}

	checkLatestScanValidity(source_resource_id: string): boolean {
		const latest_scan = this.getLatestScan(source_resource_id);

		if (!latest_scan)
			return true;

		const process_start: Date = new Date();
		process_start.setTime(process_start.getTime() - process.uptime() * 1000);

		if (!latest_scan.end_timestamp && latest_scan.start_timestamp < process_start.getTime() / 1000)
			return false;

		return true;
	}

	/** Remove any deleted media files from the database.
	 */
	private pruneSource(source: SourceSQL): number {
		const media = this.mediaSvc.getAllMedia(source.resource_id);
		let prune_count = 0;

		media.forEach(media_item => {
			let stat: fs.Stats;

			try {
				/* check file exists and can access it */
				fs.accessSync(media_item.file_full_path, fs.constants.R_OK);

				stat = fs.statSync(media_item.file_full_path);
				if (!stat.isFile())
					throw new Error(`Media not a valid file: ${media_item.file_full_path}`);
			} catch {
				/* can't access file / doesn't exist */
				this.mediaSvc.removeMedia(media_item.resource_id);
				prune_count++;
			}
		});

		return prune_count;
	}

	/** Add any new media files from the source directory, returns success.
	 *  New media files are owned by the owner of the source.
	 */
	private async populateSource(source: SourceSQL, extension_whitelist: string[]): Promise<boolean> {
		const files = flat_dir(source.path, {
			skip_hidden: true,
			extension_whitelist,
			access_constant: fs.constants.R_OK,
		});
		const source_rsrc = this.rsrcSvc.getResourceByID(source.resource_id);

		if (!source_rsrc || !files)
			return false;

		for (const file of files)
			if (!this.mediaSvc.getMediaByPath(file))
				await this.mediaSvc.addMedia(file, source_rsrc.owner_user_id, source.resource_id);

		return true;
	}
	
	// TODO: Use inotify to watch for deleted files and run at least
	// pruneSource upon event.
	
	/** Refreshes the media files associated with the source, returns
	 *  success.
	 */
	async refreshSource(source_resource_id: string): Promise<boolean> {
		const source = this.srcSvc.getSourceByID(source_resource_id);

		if (!source)
			return false;

		this.pruneSource(source);
		const populate = this.populateSource(source, extension_whitelist);

		return await populate;
	}
}