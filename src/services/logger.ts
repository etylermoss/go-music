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
				msg.join('') + '\n',
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

		if (num <= this.config.logLevel) {
			const outputMessage = msg.join('');
			let color: number = null;
			switch(level) {
				case 'FATAL_ERROR':
				case 'ERROR': color = 31; break;
				case 'WARN': color = 33; break;
				case 'INFO': color = 34; break;
				case 'EXTRA': color = 36; break;
			}
			const now = new Date(Date.now());
			const timeString = `${now.getFullYear()}:${now.getMonth()+1}:${now.getDate()} ${now.getHours()}:${now.getMinutes()+1}:${now.getSeconds()}`; // eslint-disable-line max-len
			const label = `[${level} - ${timeString}]: `;
			const consoleLabel = `\x1b[${color}m\x1b[1m${label}\x1b[0m`;
			const multiLine = outputMessage.search(/\n/) !== -1;
			const fileMessage = multiLine
				? label + '{\n' + outputMessage + '\n}'
				: label + outputMessage;

			const consoleMessage = multiLine
				? consoleLabel + '{\n' + outputMessage + '\n}'
				: consoleLabel + outputMessage;

			console[num <= 1 ? 'error' : 'log'](consoleMessage);
			fileWrite = this.writeToFile(fileMessage);
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