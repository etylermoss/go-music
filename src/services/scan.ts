/* 3rd party imports */
import fs from 'fs';
import { join, extname } from 'path';
import { Service, Inject } from 'typedi';
import { walkAsync } from 'walk-async-fd';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { SourceService } from '@/services/source';
import { MediaService } from '@/services/media';

/* 1st party imports - SQL types */
import { SourceSQL } from '@/services/source';

/* 1st party imports */
import { generateRandomID } from '@/common';
import { extension_whitelist } from '@/services/media';

export interface ScanSQL {
	scan_id: string;
	source_resource_id: string;
	start_timestamp: number;
	end_timestamp: number | null;
	changes_add: number | null;
	changes_remove: number | null;
}

export type UpdateScanSQL = Pick<ScanSQL, 'scan_id' | 'end_timestamp' | 'changes_add' | 'changes_remove'>;

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
		SELECT
			*
		FROM
			Scan
		WHERE
			scan_id = $scan_id
		`).get({scan_id}) as ScanSQL | undefined;

		return scan ?? null;
	}

	getAllScans(source_resource_id?: string): ScanSQL[] | null {
		const scans = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Scan
		WHERE
			(
				($source_resource_id IS null)
				OR (source_resource_id = $source_resource_id)
			)
		ORDER BY
			start_timestamp DESC
		`).all({source_resource_id: source_resource_id ?? null}) as ScanSQL[];

		return scans.length > 0 ? scans : null;
	}

	getLatestScan(source_resource_id?: string): ScanSQL | null {
		const scan = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Scan
		WHERE
			(
				($source_resource_id IS null)
				OR (source_resource_id = $source_resource_id)
			)
		ORDER BY
			start_timestamp DESC
		LIMIT
			1
		`).get({source_resource_id: source_resource_id ?? null}) as ScanSQL | undefined;

		return scan ?? null;
	}

	/**
	 * Find if a scan is currently underway globally or for a specific
	 * source.
	 * @param source_resource_id Limit search to a specific source
	 * @returns Source resource_id of the underway scan, or null if no scan underway
	 */
	scanUnderway(source_resource_id?: string): string | null {
		if (source_resource_id)
		{
			const latest_scan = this.getLatestScan(source_resource_id);

			if (!latest_scan || !latest_scan.end_timestamp)
				return null;

			return source_resource_id;
		}
		else
		{
			const scans = this.getAllScans();
			const activeScan = scans?.find(scan => !scan.end_timestamp) ?? null;

			if (activeScan?.source_resource_id)
				return activeScan.source_resource_id;

			return null;
		}
	}

	checkLatestScanValidity(source_resource_id?: string): boolean {
		const latest_scan = this.getLatestScan(source_resource_id);

		if (!latest_scan)
			return true;

		const process_start: Date = new Date();
		process_start.setTime(process_start.getTime() - (process.uptime() * 1000));

		if (!latest_scan.end_timestamp && latest_scan.start_timestamp < process_start.getTime() / 1000)
			return false;

		return true;
	}

	createScan(source_resource_id: string): ScanSQL | null {
		const scan: ScanSQL = {
			scan_id: generateRandomID(),
			source_resource_id: source_resource_id,
			start_timestamp: Date.now() / 1000,
			end_timestamp: null,
			changes_add: null,
			changes_remove: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO
			Scan
		VALUES
		(
			$scan_id,
			$source_resource_id,
			$start_timestamp,
			$end_timestamp,
			$changes_add,
			$changes_remove
		)
		`).run(scan).changes > 0;

		return success ? this.getScan(scan.scan_id) : null;
	}

	updateScan(updateScan: UpdateScanSQL): ScanSQL | null {
		const scan = this.getScan(updateScan.scan_id);
		let success = false;

		if (scan)
		{
			success = this.dbSvc.prepare(`
			UPDATE
				Scan
			SET
				end_timestamp = $end_timestamp,
				changes_add = $changes_add,
				changes_remove = $changes_remove
			WHERE
				scan_id = $scan_id
			`).run(updateScan).changes > 0;
		}

		return success ? this.getScan(updateScan.scan_id) : null;
	}

	/** Remove any deleted media files from the database.
	 */
	private pruneSource(source: SourceSQL): number {
		const media = this.mediaSvc.getAllMedia(source.resource_id);
		let counter = 0;

		media.forEach(media_item => {
			let stat: fs.Stats;

			try {
				/* check file exists and can access it */
				fs.accessSync(media_item.path, fs.constants.R_OK);

				stat = fs.statSync(media_item.path);
				if (!stat.isFile())
					throw new Error(`Media not a valid file: ${media_item.path}`);
			} catch {
				/* can't access file / doesn't exist */
				this.mediaSvc.removeMedia(media_item.resource_id);
				counter++;
			}
		});

		return counter;
	}

	// TODO: reformat and add all comments to below standard
	
	/**
	 * Add new media files contained within the source directory (recursive).
	 * New media files are owned by the owner of the source.
	 * @param source target source to populate (i.e. scan source.path)
	 * @param extensionWhitelist supported file extensions
	 * @returns number of new files added
	 */
	private async populateSource(source: SourceSQL, extensionWhitelist: string[]): Promise<number | null> {
		const source_resource = this.rsrcSvc.getResourceByID(source.resource_id)!;
		let counter = 0;
		
		try {
			await walkAsync(source.path, async (fh, root, name) => {
				const fullPath = join(root, name);
				const validExt = extensionWhitelist.includes(extname(name).toLowerCase());
				const foundMedia = this.mediaSvc.getMediaByPath(fullPath);

				if (validExt && !foundMedia)
				{
					const media = await this.mediaSvc.addMedia(fullPath, fh, source_resource.owner_user_id, source.resource_id);
					if (media)
						counter++;
				}
			}, {skipHidden: true});
		} catch (err) {
			// TODO: log
			return null;
		}

		return counter;
	}
	
	// TODO: Use inotify to watch for deleted files and run at least
	// pruneSource upon event.
	
	/** Scans for media files associated with the source, returns false
	 *  if the source directory cannot be opened & read, else true.
	 */
	async scanSource(source_resource_id: string): Promise<ScanSQL | null> {
		const source = this.srcSvc.getSourceByID(source_resource_id);
		if (!source) return null;
		const scan = this.createScan(source.resource_id);
		if (!scan) return null;

		const prune = this.pruneSource(source);
		const populate = await this.populateSource(source, extension_whitelist);

		return this.updateScan({
			scan_id: scan.scan_id,
			end_timestamp: Date.now() / 1000,
			changes_remove: prune,
			changes_add: populate,
		});
	}
}