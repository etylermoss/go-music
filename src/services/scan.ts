/* 3rd party imports */
import fs from 'fs';
import { extname } from 'path';
import { Service } from 'typedi';
import { walkAsync } from 'walk-async-fd';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { ResourceService } from '@/services/resource';
import { SourceService } from '@/services/source';
import { MediaService } from '@/services/media';
import { SongService } from '@/services/song';
import { ArtworkService } from '@/services/artwork';

/* 1st party imports - SQL types */
import { SourceSQL } from '@/services/source';
import { mediaSubType } from '@/services/media';

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

@Service({eager: true})
export class ScanService {

	constructor (
		private dbSvc: DatabaseService,
		private rsrcSvc: ResourceService,
		private srcSvc: SourceService,
		private mediaSvc: MediaService,
		private songSvc: SongService,
		private artSvc: ArtworkService,
	) {
		this.checkAllScansValidity(true);
	}

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

			if (latestScan === null || latestScan.endTime === null)
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
	 * Scan for new/missing media files in the path associated with the given source.
	 * @param sourceResourceID ID of source resource
	 * @param pruneOnly If true, new media files are not added to the database, only missing ones removed
	 * @returns Completed scan
	 */
	async scanSource(sourceResourceID: string, pruneOnly?: boolean): Promise<ScanSQL | null> {
		const source = this.srcSvc.getSourceByID(sourceResourceID);
		if (!source) return null;
		const scan = this.createScan(source.resourceID);
		if (!scan) return null;

		const prune = await this.pruneSource(source);
		const populate = !pruneOnly ? await this.populateSource(source, extensionWhitelist) : null;

		return this.updateScan({
			scanID: scan.scanID,
			endTime: Date.now() / 1000,
			changesRemove: prune,
			changesAdd: populate,
		});
	}

	/**
	 * Remove missing media files in the path associated with the source.
	 * @param source Target source to prune
	 * @returns Count of missing media files removed
	 */
	private async pruneSource(source: SourceSQL): Promise<number> {
		const allMedia = this.mediaSvc.getAllMedia(source.resourceID);
		let counter: number = 0;
		let file: fs.promises.FileHandle | null;
		let stat: fs.Stats | null;

		for (const media of allMedia) {
			file = null;
			stat = null;

			try {
				/* check file exists and can access (read) it */
				file = await fs.promises.open(media.path, 'r');
				stat = await file.stat();

				if (!stat.isFile())
					throw new Error(`Media not a valid file: ${media.path}`);

			} catch {
				/* can't access file / doesn't exist */
				switch (media.subType) {
					case mediaSubType.SONG:
						this.songSvc.deleteSong(media.resourceID);
						break;
					case mediaSubType.ARTWORK:
						this.artSvc.deleteArtwork(media.resourceID);
						break;
					case mediaSubType.UNSET:
					default:
						this.mediaSvc.deleteMedia(media.resourceID);
				}

				counter++;
			} finally {
				if (file) {
					await file.close();
				}
			}
		}

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
			await walkAsync(source.path, async (path) => {
				const validExt = extensionWhitelist.includes(extname(path).toLowerCase());
				const foundMedia = this.mediaSvc.getMediaByPath(path);

				if (validExt && !foundMedia)
				{
					const media = await this.mediaSvc.createMedia(path, sourceResource.ownerUserID, source.resourceID);
					if (media)
						counter++;
				}
			}, {skipHidden: true});
		} catch (err) {
			// TODO: Log, could not access source path, is it not a directory?
			return null;
		}

		return counter;
	}

	/**
	 * Check that the latest scan for each source completed successfully,
	 * I.e. if the scans start time was before the server was started,
	 * and it has not completed, it must have failed.
	 * @param fix Should the source be scanned again if the last scan failed
	 */
	private async checkAllScansValidity(fix?: boolean): Promise<void> {
		const processStart: Date = new Date();
		processStart.setTime(processStart.getTime() - (process.uptime() * 1000));

		for (const source of this.srcSvc.getAllSources())
		{
			const scan = this.getLatestScan(source.resourceID);

			if (!scan)
				return;

			if (!scan.endTime && scan.startTime < processStart.getTime() / 1000 && fix === true)
				await this.scanSource(source.resourceID, true);
		}
	}
}