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
import { extensionWhitelist } from '@/services/media';

export interface ScanSQL {
	scanID: string;
	sourceResourceID: string;
	startTime: number;
	endTime: number | null;
	changesAdd: number | null;
	changesRemove: number | null;
}

export type UpdateScanSQL = Pick<ScanSQL, 'scanID' | 'endTime' | 'changesAdd' | 'changesRemove'>;

// TODO: convert checkLatestScanValidity to checkAllScanValidity, return array of
//       invalid scans, and run scanSource on each
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

	getScan(scanID: string): ScanSQL | null {
		const scan = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Scan
		WHERE
			scanID = $scanID
		`).get({scanID}) as ScanSQL | undefined;

		return scan ?? null;
	}

	getAllScans(sourceResourceID?: string): ScanSQL[] | null {
		const scans = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Scan
		WHERE
			(
				($sourceResourceID IS null)
				OR (sourceResourceID = $sourceResourceID)
			)
		ORDER BY
			startTime DESC
		`).all({sourceResourceID: sourceResourceID ?? null}) as ScanSQL[];

		return scans.length > 0 ? scans : null;
	}

	getLatestScan(sourceResourceID?: string): ScanSQL | null {
		const scan = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			Scan
		WHERE
			(
				($sourceResourceID IS null)
				OR (sourceResourceID = $sourceResourceID)
			)
		ORDER BY
			startTime DESC
		LIMIT
			1
		`).get({sourceResourceID: sourceResourceID ?? null}) as ScanSQL | undefined;

		return scan ?? null;
	}

	/**
	 * Find if a scan is currently underway globally or for a specific
	 * source.
	 * @param sourceResourceID Limit search to a specific source
	 * @returns Source resourceID of the underway scan, or null if no scan underway
	 */
	scanUnderway(sourceResourceID?: string): string | null {
		if (sourceResourceID)
		{
			const latestScan = this.getLatestScan(sourceResourceID);

			if (!latestScan || !latestScan.endTime)
				return null;

			return sourceResourceID;
		}
		else
		{
			const scans = this.getAllScans();
			const activeScan = scans?.find(scan => !scan.endTime) ?? null;

			if (activeScan?.sourceResourceID)
				return activeScan.sourceResourceID;

			return null;
		}
	}

	checkLatestScanValidity(sourceResourceID?: string): boolean {
		const latestScan = this.getLatestScan(sourceResourceID);

		if (!latestScan)
			return true;

		const processStart: Date = new Date();
		processStart.setTime(processStart.getTime() - (process.uptime() * 1000));

		if (!latestScan.endTime && latestScan.startTime < processStart.getTime() / 1000)
			return false;

		return true;
	}

	createScan(sourceResourceID: string): ScanSQL | null {
		const scan: ScanSQL = {
			scanID: generateRandomID(),
			sourceResourceID: sourceResourceID,
			startTime: Date.now() / 1000,
			endTime: null,
			changesAdd: null,
			changesRemove: null,
		};

		const success = this.dbSvc.prepare(`
		INSERT INTO
			Scan
		VALUES
		(
			$scanID,
			$sourceResourceID,
			$startTime,
			$endTime,
			$changesAdd,
			$changesRemove
		)
		`).run(scan).changes > 0;

		return success ? this.getScan(scan.scanID) : null;
	}

	updateScan(updateScan: UpdateScanSQL): ScanSQL | null {
		const scan = this.getScan(updateScan.scanID);
		let success = false;

		if (scan)
		{
			success = this.dbSvc.prepare(`
			UPDATE
				Scan
			SET
				endTime = $endTime,
				changesAdd = $changesAdd,
				changesRemove = $changesRemove
			WHERE
				scanID = $scanID
			`).run(updateScan).changes > 0;
		}

		return success ? this.getScan(updateScan.scanID) : null;
	}

	/** Remove any deleted media files from the database.
	 */
	private pruneSource(source: SourceSQL): number {
		const allMedia = this.mediaSvc.getAllMedia(source.resourceID);
		let counter = 0;

		allMedia.forEach(media => {
			let stat: fs.Stats;

			try {
				/* check file exists and can access it */
				fs.accessSync(media.path, fs.constants.R_OK);

				stat = fs.statSync(media.path);
				if (!stat.isFile())
					throw new Error(`Media not a valid file: ${media.path}`);
			} catch {
				/* can't access file / doesn't exist */
				this.mediaSvc.removeMedia(media.resourceID);
				counter++;
			}
		});

		return counter;
	}
	
	/**
	 * Add new media files contained within the source directory (recursive).
	 * New media files are owned by the owner of the source.
	 * @param source target source to populate (i.e. scan source.path)
	 * @param extensionWhitelist supported file extensions
	 * @returns number of new files added
	 */
	private async populateSource(source: SourceSQL, extensionWhitelist: string[]): Promise<number | null> {
		const sourceResource = this.rsrcSvc.getResourceByID(source.resourceID)!;
		let counter = 0;
		
		try {
			await walkAsync(source.path, async (fh, root, name) => {
				const fullPath = join(root, name);
				const validExt = extensionWhitelist.includes(extname(name).toLowerCase());
				const foundMedia = this.mediaSvc.getMediaByPath(fullPath);

				if (validExt && !foundMedia)
				{
					const media = await this.mediaSvc.addMedia(fullPath, fh, sourceResource.ownerUserID, source.resourceID);
					if (media)
						counter++;
				}
			}, {skipHidden: true});
		} catch (err) {
			// TODO: Log
			return null;
		}

		return counter;
	}
	
	// TODO: Use inotify to watch for deleted files and run at least
	// pruneSource upon event.
	
	/** Scans for media files associated with the source, returns false
	 *  if the source directory cannot be opened & read, else true.
	 */
	async scanSource(sourceResourceID: string): Promise<ScanSQL | null> {
		const source = this.srcSvc.getSourceByID(sourceResourceID);
		if (!source) return null;
		const scan = this.createScan(source.resourceID);
		if (!scan) return null;

		const prune = this.pruneSource(source);
		const populate = await this.populateSource(source, extensionWhitelist);

		return this.updateScan({
			scanID: scan.scanID,
			endTime: Date.now() / 1000,
			changesRemove: prune,
			changesAdd: populate,
		});
	}
}