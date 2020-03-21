/* 3rd party imports */
import path from 'path';
import SQLite3 from 'better-sqlite3';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';

/* 1st party imports */
import { ConfigSchema } from 'go-music/config';
import Constants from 'go-music/constants';
import { treeToXML, getXMLDiff, Diff } from 'go-music/api/sources';
import { launchGraphql } from 'go-music/api/graphql';
import { launchRest, RestServer } from 'go-music/api/rest';

/* 1st party imports (SQL) */
import Schema from 'go-music/api/db-setup/schema.sql';
import Pragma from 'go-music/api/db-setup/pragma.sql';

/** User defined directory where music files are gathered from, e.g ~/Music/ */
interface SQL_SourceDir {
	/** ID (rowid) of the row */
	id?: number;
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
	rest: RestServer;

	constructor(config: ConfigSchema) {
		this.config = config;

		try {
			this.db = new SQLite3(path.join(this.config.dataDirectory, 'go-music.db'));
		} catch(err) {
			Constants.FATAL_ERROR(`Error creating SQLite3 DB: ${err}`);
		}
		
		this.db.exec(Schema);
		this.db.exec(Pragma);

		this.graphql = launchGraphql();
		this.rest = launchRest();
	}

	getMiddleware(): express.Router {
		const router = express.Router();

		router.use(this.graphql.getMiddleware({path: '/graphql'}));
		router.use(this.rest.getMiddleware({path: '/rest'}));

		return router;
	}

	// should be in graphql
	async addSource(path: string, enabled: number): Promise<void> {
		treeToXML(path, Constants.extensionWhitelist)
			.then(xmlTree => {
				const statement = this.db.prepare('INSERT INTO sourceDirs (path, xmlTree, enabled) VALUES (?, ?, ?)');
				statement.run(path, xmlTree, enabled ? 1 : 0);
			});
	}

	// should be in graphql
	getSourceInfo(path: string): SQL_SourceDir {
		const statement = this.db.prepare('SELECT path, xmlTree, enabled FROM sourceDirs WHERE path = ?');
		return statement.get(path);
	}

	// should be in graphql
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
	
	stop(): void {
		this.db.close();
	}

}

export default Api;