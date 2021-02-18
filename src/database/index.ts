/* 3rd party imports */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';
import { Service, Container } from 'typedi';

/* 1st party imports */
import { ConfigSchema } from '@/config';

/* 1st party imports - SQL */
import User from '@/database/tables/00-user.sql';
import Authentication from '@/database/tables/01-authentication.sql';
import Resource from '@/database/tables/02-resource.sql';
import AccessControl from '@/database/tables/03-access-control.sql';
import Source from '@/database/tables/04-source.sql';
import Media from '@/database/tables/05-media.sql';
import Song from '@/database/tables/06-song.sql';
import Artwork from '@/database/tables/07-artwork.sql';

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
		
		[User, Authentication, Resource, AccessControl, Source, Media, Song, Artwork].forEach(sql => this.exec(sql));
	}
}