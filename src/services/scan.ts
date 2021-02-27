/* 3rd party imports */
import fs from 'fs';
import { join, extname } from 'path';
import { Service } from 'typedi';
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

@Service()
export class ScanService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
		private srcSvc: SourceService,
		private mediaSvc: MediaService,
	) {}

	/**
	 * Retrieve a scan, search by scanID.
	 * @param scanID ID of scan
	 * @returns Scan
	 */
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

	/**
	 * Retrieve all scans.
	 * Can search globally or for a specific source.
	 * @param sourceResourceID Optional source ID to limit search to
	 * @returns Source array
	 */
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

	/**
	 * Retrieve the latest scan.
	 * Can search globally or for a specific source.
	 * @param sourceResourceID Optional source ID to limit search to
	 * @returns Scan
	 */
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
	 * Find if a scan is currently underway.
	 * Can search globally or for a specific source.
	 * @param sourceResourceID Optional source ID to limit search to
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

	/**
	 * Check that the latest scan completed successfully.
	 * I.e. if the scans start time was before the server was started,
	 * and it has not completed, it must have failed.
	 * TODO: run this on startup of this service for each source
	 * @param sourceResourceID Optional source ID to limit search to 
	 * @returns Validity of found scan (true if none found)
	 */
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

	/**
	 * Create new scan.
	 * @param sourceResourceID Parent source ID of the scan
	 * @returns Scan
	 */
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

	/**
	 * Update fields of the given scan, use when scan is complete.
	 * Searches by updateScan.scanID.
	 * @param updateScan Scan fields to update
	 * @returns Updated scan
	 */
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

	/**
	 * Remove missing media files in the path associated with the source.
	 * @param source Target source to prune
	 * @returns Count of missing media files removed
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
				this.mediaSvc.deleteMedia(media.resourceID);
				counter++;
			}
		});

		return counter;
	}
	
	/**
	 * Add new media files in the path associated with the source.
	 * New media files are owned by the owner of the source.
	 * @param source Target source to populate
	 * @param extensionWhitelist Supported file extensions
	 * @returns Count of new media files added
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
					const media = await this.mediaSvc.createMedia(fullPath, fh, sourceResource.ownerUserID, source.resourceID);
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
	
	/**
	 * Scan for new/missing media files in the path associated with the given source.
	 * @param sourceResourceID ID of source resource
	 * @returns Completed scan
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