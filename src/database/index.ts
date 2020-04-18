/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import SQLite3 from 'better-sqlite3';

/* 1st party imports */
import GlobalConfig from '@G/config.json';
import Common from '@/common';
import { ConfigSchema } from '@/config';

/* 1st party imports (SQL) */
import Schema from '@/api/db-setup/schema.sql';
import Pragma from '@/api/db-setup/pragma.sql';

class Api {
	
	private config: ConfigSchema;
	private db: SQLite3.Database;

	constructor(config: ConfigSchema) {
		this.config = config;

		try {
			if (!fs.existsSync(this.config.dataDirectory)) fs.mkdirSync(this.config.dataDirectory, '0700');
			this.db = new SQLite3(path.join(this.config.dataDirectory, 'go-music.db'));
		} catch(err) {
			Common.FATAL_ERROR(`Error creating SQLite3 DB: ${err}`);
		}
		
		this.db.exec(Schema);
		this.db.exec(Pragma);

	}

	stop(): void {
		this.db.close();
	}

}

export default Api;