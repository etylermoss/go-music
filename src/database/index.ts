/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';
import { Service, Container } from 'typedi';

/* 1st party imports */
import { ConfigSchema } from '@/config';
import { LoggerService } from '@/services/logger';

/* 1st party imports - SQL */
import Schema from '@/database/setup/schema.sql';
import Pragma from '@/database/setup/pragma.sql';

@Service('database.service')
export class DatabaseService extends sqlite {

	constructor() {
		const config: ConfigSchema = Container.get('config');
		const logSvc: LoggerService = Container.get('logger.service');
		const databaseOptions: sqlite.Options = {
			verbose: (msg: string) => {
				if (msg.slice(0, 10) !== '/*UNSAFE*/') {
					logSvc.logSql(msg);
				}
			},
		};

		if (!fs.existsSync(config.dataDirectory)) fs.mkdirSync(config.dataDirectory, '0700');

		super(path.join(config.dataDirectory, 'go-music.db'), databaseOptions);

		this.exec(Schema);
		this.exec(Pragma);
	}
}