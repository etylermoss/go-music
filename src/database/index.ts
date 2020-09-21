/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';
import { Service, Container } from 'typedi';

/* 1st party imports */
import { ConfigSchema } from '@/config';

/* 1st party imports - SQL */
import Users from '@/database/tables/00-users.sql';
import Authentication from '@/database/tables/01-authentication.sql';
import Resources from '@/database/tables/02-resources.sql';
import AccessControl from '@/database/tables/03-access-control.sql';
import Sourcing from '@/database/tables/04-sourcing.sql';

const Pragma = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
`;

@Service('database.service')
export class DatabaseService extends sqlite {

	constructor() {
		const config: ConfigSchema = Container.get('config');

		if (!fs.existsSync(config.dataDirectory)) fs.mkdirSync(config.dataDirectory, '0700');

		super(path.join(config.dataDirectory, 'go-music.db'));

		this.exec(Pragma);
		
		[Users, Authentication, Resources, AccessControl, Sourcing].forEach(sql => this.exec(sql));
	}
}