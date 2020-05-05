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

@Service('database.service')
export abstract class DatabaseService {
	protected readonly connection: sqlite.Database;
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
			this.connection = new sqlite(
				path.join(this.config.dataDirectory, 'go-music.db'),
				databaseOptions,
			);
		} catch(err) {
			this.logger.log('FATAL_ERROR', `Error creating SQLite3 DB: `, err);
		}
		
		this.connection.exec(Schema);
		this.connection.exec(Pragma);
	}
}