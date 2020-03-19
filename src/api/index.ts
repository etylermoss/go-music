/* 3rd party imports */
import path from 'path';
import SQLite3 from 'better-sqlite3';
import express from 'express';

/* 1st party imports */
import { ConfigSchema } from 'go-music/config';
import Constants from 'go-music/constants';
import { treeToXML, getXMLDiff, Diff } from 'go-music/api/sources';
import { launchGraphql } from 'go-music/api/graphql';

/* 1st party imports (SQL) */
import Schema from 'go-music/go-api/db-setup/schema.sql';
import Pragma from 'go-music/go-api/db-setup/pragma.sql';

/* Debug */
import util from 'util';
import { ApolloServer } from 'apollo-server-express';

/** User defined directory where music files are gathered from, e.g ~/Music/ */
interface SQL_SourceDir {
	/** Path to the directory */
	path?: string;
	/** XML String representing the directories tree */
	xmlTree?: string;
	/** SQLite boolean, 0 === false, 1 === true */
	enabled?: number;
}

class Api {
	
	private config: ConfigSchema;
	private db: SQLite3.Database;

	graphql: ApolloServer;

	constructor(config: ConfigSchema) {
		this.config = config;

		try {
			this.db = new SQLite3(path.join(this.config.dataDirectory, 'go-music.db'));
		} catch(err) {
			Constants.FATAL_ERROR(`Error creating SQLITE DB: ${err}`);
		}
		
		this.db.exec(Schema);
		this.db.exec(Pragma);

		this.graphql = launchGraphql();
	}

	getMiddleware(): express.Router {
		const router = express.Router();

		router.use(this.graphql.getMiddleware({path: '/graphql'}));

		return router;
	}

	async addSource(path: string, enabled: number): Promise<void> {
		treeToXML(path, Constants.extensionWhitelist)
			.then(xmlTree => {
				const statement = this.db.prepare('INSERT INTO sourceDirs (path, xmlTree, enabled) VALUES (?, ?, ?)');
				statement.run(path, xmlTree, enabled ? 1 : 0);
			});
	}

	getSourceInfo(path: string): SQL_SourceDir {
		const statement = this.db.prepare('SELECT path, xmlTree, enabled FROM sourceDirs WHERE path = ?');
		return statement.get(path);
	}

	/** Scans a single sourcing directory and returns the difference.
	 *  If the scan fails, an error is thrown.
	 */
	async scanSource(sourceDir: SQL_SourceDir): Promise<Diff[]> {
		return treeToXML(sourceDir.path, Constants.extensionWhitelist)
			.then(xml => {
				return getXMLDiff(sourceDir.xmlTree, xml);
			})
			.catch(err => {
				const msg = `Something went wrong scanning ${sourceDir.path}`;
				console.error(`${msg}:\n  ${err}`);
				throw msg;
			});
	}

	async handleSourceChanges(changes: Diff[][]): Promise<void> {
		console.log('Source changes have occured: \n' + util.inspect(changes, false, null));
	}
	
	stop(): void {
		this.db.close();
	}

}

export default Api;