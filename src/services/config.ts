/* 3rd party imports */
import fs, { Dir } from 'fs';
import path from 'path';
import minimist from 'minimist';
import xdgBasedir from 'xdg-basedir';
import toml from '@iarna/toml';
import { Service } from 'typedi';

/* 1st party imports */
import GlobalConfig from '@G/config.json';

/** Schema of application configuration object / file */
export interface ConfigSchema {
	port: number;
	/** Log file path, where logging data will be written */
	logFile: string;
	/** Maximum number of clients any one user can have logged in */
	maxClients: number;
	/** Data directory (e.g Database files), usually ~/.local/go-music/ */
	dataDirectory: string;
	/** Private options cannot be changed by the configuration file */
	private: {
		/** Configuration directory, usually ~/.config/go-music/ */
		configDirectory: string;
		/** Directory containing the built frontend */
		frontendDirectory: string;
		/** True when run with --api-only */
		apiOnly: boolean;
		/** Generate schema.gql file (then exit) with -s or --gen-schema */
		genSchema: boolean;
	};
}

/** Preamble text to be placed at the start of the
 *  configuration file to give information about it.
 */
const configPreamble =
`\
# Go Music: Configuration file.

# This file is written in the TOML format.
# Available options: <GITHUB/WIKI>.
# See: https://wikipedia.org/wiki/TOML.
\n`;

/** Help information used when the user runs the
 *  application with -h or --help. 
 */
const getHelpInfo = (port: number): string => {
	return `\
Go Music: Personal music server.

  -c, --config: The directory of the configuration
    files. It will be created if it does not exist,
	and contain go-music.config.toml.
	Defaults to ~/.config/go-music/
  -p, --port: The port to run the server on.
	Currently this is overridden by the config file.
	Defaults to ${port}
  -l, --log-level: Verbosity of logging output.
	Accepts an integer from 0 to 4, with 4 being
	the most verbose.
  -a, --api-only: Runs the backend of the application
    only, useful when developing frontend code.
  -h, --help: Print this help message.`;
};

/** Checks whether the provided paths[] are absolute,
 *  i.e they always resolve to the same location
 *  regardless of the working directory.
 */
const arePathsAbsolute = (callback: Function, ...paths: string[]): any => {
	for (const dirPath of paths) {
		if (!path.isAbsolute(dirPath)) {
			return callback(dirPath);
		}
	}
};

@Service({eager: true})
export class ConfigService {

	private config: ConfigSchema;

	constructor () {
		/* Default configuration options */
		this.config = {
			port: GlobalConfig.port,
			logFile: RELEASE
				? path.join('/tmp', 'go-music.log')
				: path.join(__dirname, './runtime/go-music.log'),
			maxClients: 8,
			dataDirectory: RELEASE
				? path.join(xdgBasedir?.data ?? '/', '/go-music')
				: path.join(__dirname, './runtime/data'),
			private: {
				apiOnly: false,
				genSchema: false,
				configDirectory: RELEASE
					? path.join(xdgBasedir?.config ?? '/', '/go-music')
					: path.join(__dirname, './runtime/config'),
				frontendDirectory: RELEASE
					? path.join(__dirname, './frontend')
					: path.join(__dirname, '../frontend/build'),
			},
		};
	}

	get(): ConfigSchema {
		return this.config;
	}

	/**
	 * Generate or loads the config file (sets the config property of this
	 * service once complete).
	 * @param configFileName Name of the config file
	 * @param args CLI arguments (e.g. argv[2..∞])
	 */
	async generateConfig(configFileName: string, args: string[]): Promise<void> {
		const cliConfig = this.manageCliArgs(args, this.config);

		arePathsAbsolute(
			(path: string): void => {
				console.error(`${path} is not an absolute directory path.`);	
				process.exit(1); // FatalError
			},
			cliConfig.dataDirectory,
			cliConfig.private.configDirectory,
			cliConfig.private.frontendDirectory,
		);
	
		try {
			this.config = await this.openConfig(path.join(cliConfig.private.configDirectory, configFileName), cliConfig);
		} catch(err) {
			console.error(err);	
			process.exit(1); // FatalError
		}
	}

	/**
	 * Parse minimist CLI arguments, applying them to the supplied 
	 * configuration object where applicable.
	 * @param args CLI arguments (e.g. argv[2..∞])
	 * @param config Configuration object
	 * @returns Mutated configuration object
	 */
	private manageCliArgs(args: string[], config: ConfigSchema): ConfigSchema {
		const mArgs = minimist(args);
		switch(true) {
			// -c, --config: config directory path
			case Boolean(mArgs?.c || mArgs?.config):
				config.private.configDirectory = mArgs.c ? mArgs.c : mArgs.config;
				break;
			// -p, --port: port to run the server on
			case Boolean(mArgs?.p || mArgs?.port):
				config.port = mArgs.p ? mArgs.p : mArgs.port;
				break;
			// -a, --api-only: don't serve frontend
			case Boolean(mArgs?.a || mArgs['api-only']):
				config.private.apiOnly = true;
				break;
			// -s, --gen-schema
			case Boolean(mArgs?.s || mArgs['gen-schema']):
				config.private.genSchema = true;
				break;
			// -h, --help: print help information
			case Boolean(mArgs?.h || mArgs?.help):
				console.log(getHelpInfo(config.port));
				process.exit(0);
		}

		return config;
	}

	/**
	 * Load config file and create ConfigSchema object from it, or create
	 * the file from defaults if it does not exist.
	 * @param configPath Filesystem path of the config file
	 * @param defaultConfig Default config
	 */
	async openConfig(configPath: string, defaultConfig: ConfigSchema ): Promise<ConfigSchema> {
		const dirIsDir = async (dir: Dir): Promise<void> => {
			return fs.promises.lstat(dir.path)
				.then(stats => {
					const dirPath = dir.path;
					dir.close();
					if (stats.isDirectory()) {
						return;
					} else {
						throw `${dirPath} exists but is not a directory`;
					}
				});
		};
		const dirCreate = async (): Promise<void> => {
			const configDir = path.dirname(configPath);
			return fs.promises.mkdir(configDir, '0750')
				.catch(() => { throw `Could not create ${configDir}` });
		};
		const openFile = async (): Promise<ConfigSchema> => {
			/* BUG?: flags: 'w+' reports file size incorrectly as 0,
			*  instead we use the raw Linux kernel mode integer.
			*  See: http://man7.org/linux/man-pages/man2/open.2.html
			*  And: fs.constants.
			*/
			return fs.promises.open(configPath, 66, '0750')
				.then(async file => {
					/* Get file information */
					return file.stat()
						.then(async stats => {
							/* Check if the file is empty */
							if (stats.size !== 0) {
								/* Read config from file */
								return file.readFile('utf8')
									.then(content => toml.parse(content))
									.then(contentParsed => {
										/* Copies any values from the config
										* file into the existing config
										*/
										return Object.assign({}, ...Object.keys(defaultConfig).map(key => {
											const newKey = key in contentParsed as any
												&& key === 'private'
												? defaultConfig
												: contentParsed as any;
											return {[key]: newKey[key]};
										})) as ConfigSchema;
									})
									.catch(() => { throw `Could not read ${path.basename(configPath)}` });
							} else {
								/* Write default config to file */
								return file.write(configPreamble + toml.stringify(defaultConfig as any))
									.then(() => defaultConfig)
									.catch(() => { throw `Could not write to ${path.basename(configPath)}` });
							}
						})
						.then(_config => {
							file.close();
							return _config;
						})
						.catch(err => { throw err });
				})
				.catch(err => { throw err });
		};

		return fs.promises.opendir(path.dirname(configPath))
			.then(dirIsDir, dirCreate)
			/* Throw if the dir isn't a dir, or can't be created */
			.catch(err => { throw err })
			/* Can now handle the actual config file */
			.then(() => openFile())
			/* Error opening the config file */
			.catch(err => { throw err });
	}
}