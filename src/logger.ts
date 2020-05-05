/* 3rd party imports */
import fs from 'fs';
import { Service, Inject } from 'typedi';
import StripIndent from 'strip-indent';

/* 1st party imports */
import { ConfigSchema } from '@/config';

export enum LogLevel {
	/** (0) Fatal errors */
	FATAL_ERROR,
	/** (1) General errors */
	ERROR,
	/** (2) General warnings */
	WARN,
	/** (3) General information */
	INFO,
	/** (4) SQL statements for development */
	EXTRA,
}

type LogLevelStrings = keyof typeof LogLevel;

@Service('logger.service')
export class LoggerService {

	/* Inject Config */
	@Inject('config')
	private readonly config: ConfigSchema

	private async writeToFile(...msg: any[]): Promise<void> {
		if (this.config.logFile !== '') {
			return fs.promises.appendFile(
				this.config.logFile,
				msg.join(''),
				{
					mode: '0700',
				},
			);
		}
		return Promise.resolve();
	}

	async log(level: LogLevelStrings, ...msg: any[]): Promise<void> {
		const num = LogLevel[level];
		let fileWrite: Promise<void>;
		msg.unshift(`[${level}]:`);
		if (num <= this.config.logLevel) {
			console[num <= 1 ? 'error' : 'log'](...msg);
			fileWrite = this.writeToFile(...msg);
		}
		if (level === 'FATAL_ERROR') {
			await fileWrite;
			process.exit(1);
		}
	}

	async logSql(unsafe: boolean, msg: string): Promise<void> {
		if (!unsafe) this.log('EXTRA', StripIndent(msg));
	}

}