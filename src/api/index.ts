/* 3rd party imports */
import path from 'path';
import SQLite3 from 'better-sqlite3';

/* 1st party imports, SQL */
import Schema from './db-setup/schema.sql';
import Pragma from './db-setup/pragma.sql';

// debug
import util from 'util';

/** User defined directory where music files are gathered from, e.g ~/Music/ */
interface SQL_SourceDir {
	/** Path to the directory */
	path?: string;
	/** XML String representing the directories tree */
	xmlTree?: string;
	/** SQLite boolean, 0 === false, 1 === true */
	enabled?: number;
}

import { treeToXML, getXMLDiff, Diff } from './sources';

class AppApi {
	private db: SQLite3.Database;
	private dataDir: string;
	private extWhitelist: string[];

	constructor(dataDir: string, extWhitelist: string[]) {
		this.dataDir = dataDir;
		this.extWhitelist = extWhitelist;

		try {
			this.db = new SQLite3(path.join(this.dataDir, 'go-music.db'));
		} catch(err) {
			console.error('Error creating SQLITE DB: ' + err);
		}
		
		this.db.exec(Schema);
		this.db.exec(Pragma);

	}

	async addSource(path: string): Promise<void> {
		treeToXML(path, this.extWhitelist)
			.then(xmlTree => {
				const statement = this.db.prepare('INSERT INTO sourceDirs (path, xmlTree, enabled) VALUES (?, ?, 1)');
				statement.run(path, xmlTree);
			});
	}

	getSourceInfo(path: string): SQL_SourceDir {
		const statement = this.db.prepare('SELECT path, xmlTree, enabled FROM sourceDirs WHERE path = ?');
		return statement.get(path);
	}

	// TODO: Convert scanSources into scanSource,
	// users may want to just scan 1 source.
	// Create scanAllSources() functions.
	async scanSources(): Promise<Diff[][]> {
		const sourceDirs: SQL_SourceDir[] = this.db.prepare('SELECT path, xmlTree FROM sourceDirs WHERE enabled = 1').all();
		if (!sourceDirs) return null;

		const changes: Diff[][] = [];
		for await (const sourceDir of sourceDirs) {
			treeToXML(sourceDir.path, this.extWhitelist)
				.then(xml => {
					changes.push(getXMLDiff(sourceDir.xmlTree, xml));
				})
				.catch(() => {
					console.error(`Something went wrong scanning ${sourceDir.path}.`);
				});
		}
		return changes;
	}

	async handleSourceChanges(changes: Diff[][]): Promise<void> {
		console.log('Source changes have occured: \n' + util.inspect(changes, false, null));
	}
	
	stop(): void {
		this.db.close();
	}
}

export default AppApi;