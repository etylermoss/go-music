/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';
import { Service, Container } from 'typedi';

/* 1st party imports */
import { ConfigSchema } from '@/config';
import { LoggerService } from '@/logger';

/* 1st party imports - SQL */
import Schema from '@/database/setup/schema.sql';
import Pragma from '@/database/setup/pragma.sql';

@Service()
export abstract class DatabaseService {
	protected readonly db: sqlite.Database;
	protected readonly config: ConfigSchema;
	protected readonly logger: LoggerService;

	constructor() {
		this.config = Container.get('config');
		this.logger = Container.get('logger.service');
		
		const databaseOptions: sqlite.Options = {
			verbose: (msg: string) => {
				this.logger.logSql(msg.slice(0, 10) === '/*UNSAFE*/', msg);
			},
		};

		try {
			if (!fs.existsSync(this.config.dataDirectory)) fs.mkdirSync(this.config.dataDirectory, '0700');
			this.db = new sqlite(
				path.join(this.config.dataDirectory, 'go-music.db'),
				databaseOptions,
			);
		} catch(err) {
			this.logger.log('FATAL_ERROR', `Error creating SQLite3 DB: `, err);
		}
		
		this.db.exec(Schema);
		this.db.exec(Pragma);
	}
}