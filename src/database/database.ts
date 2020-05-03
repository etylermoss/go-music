/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';
import { Service, Container } from 'typedi';

/* 1st party imports */
import { FATAL_ERROR } from '@/common';
import { ConfigSchema } from '@/config';

/* 1st party imports - SQL */
import Schema from '@/database/setup/schema.sql';
import Pragma from '@/database/setup/pragma.sql';

@Service('database.service')
export abstract class DatabaseService {
	protected readonly connection: sqlite.Database;
	protected config: ConfigSchema; // should be private

	constructor() {
		this.config = Container.get('config');
		
		const databaseOptions: sqlite.Options = {
			verbose: RELEASE ? undefined : console.log,
		};

		try {
			if (!fs.existsSync(this.config.dataDirectory)) fs.mkdirSync(this.config.dataDirectory, '0700');
			this.connection = new sqlite(path.join(this.config.dataDirectory, 'go-music.db'), databaseOptions);
		} catch(err) {
			FATAL_ERROR(`Error creating SQLite3 DB: `, err);
		}
		
		this.connection.exec(Schema);
		this.connection.exec(Pragma);
	}
}