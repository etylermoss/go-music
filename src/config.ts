/* 3rd party imports */
import fs, { Dir } from 'fs';
import path from 'path';
import xdgBasedir from 'xdg-basedir';
import toml from '@iarna/toml';

/* 1st party imports */
import globalConfig from 'globalConfig';

/** Schema of application configuration object / file */
export interface ConfigSchema {
    dataDirectory: string;
	port: number;
	/** Private options cannot be changed by the configuration file */
    private: {
		/** Configuration directory, usually ~/.config/go-music */
		configDirectory: string;
		/** Directory containing the built frontend */
		frontendDirectory: string;
		/** True when run with --api-only */
		apiOnly: boolean;
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

/** The default configuration options */
export const defaultConfig: ConfigSchema = {
	dataDirectory: RELEASE ? path.join(xdgBasedir.data, '/go-music') : path.join(__dirname, './runtime/data'),
	port: globalConfig.port,
	private: {
		configDirectory: RELEASE ? path.join(xdgBasedir.config, '/go-music') : path.join(__dirname, './runtime/config'),
		frontendDirectory: RELEASE ? path.join(__dirname, './frontend') : path.join(__dirname, '../frontend/build'),
		apiOnly: false
	}
};

/** Load config file and create ConfigSchema object from it,
 *  or create the file from defaults if it does not exist.
 */
export const openConfig = async (configPath: string, config: ConfigSchema ): Promise<ConfigSchema> => {
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
		/** BUG?: flags: 'w+' reports file size incorrectly as 0,
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
									/* Copies any values from the config file into the existing config */
									return Object.assign({}, ...Object.keys(config).map(key => {
										const newKey = key in contentParsed as any && key !== 'private' ? contentParsed as any : config;
										return {[key]: newKey[key]};
									})) as ConfigSchema;
								})
								.catch(() => { throw `Could not read ${path.basename(configPath)}` });
						} else {
							/* Write default config to file */
							return file.write(configPreamble + toml.stringify(config as any))
								.then(() => config)
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
		/* If the dir isn't a dir, or can't be created, the function is thrown */
		.catch(err => { throw err })
		/* Can now handle the actual config file */
		.then(() => openFile())
		/* Error opening the config file */
		.catch(err => { throw err });
};
