/* 3rd party imports */
import fs, { Dir } from 'fs';
import path from 'path';
import xdgBasedir from 'xdg-basedir';
import toml from '@iarna/toml';

/* 1st party imports */
import globalConfig from 'go-music/global-config';
import Constants from 'go-music/constants';

export interface ConfigSchema {
    dataDirectory: string;
	port: number;
	/** Private options cannot be changed by the configuration file */
    private: {
		/** Configuration directory, usually ~/.config/go-music */
		configDirectory: string;
		/** Directory containing the built client / frontend */
		clientDirectory: string;
    };
}

/** The default configuration options */
const defaultConfig: ConfigSchema = {
	dataDirectory: process.env.release ? path.join(xdgBasedir.data, '/go-music') : path.join(__dirname, './runtime/data'),
	port: globalConfig.port,
	private: {
		configDirectory: process.env.release ? path.join(xdgBasedir.config, '/go-music') : path.join(__dirname, './runtime/config'),
		clientDirectory: process.env.release ? path.join(__dirname, './client') : path.join(__dirname, '../client/build')
	}
};

/** Load config file and create ConfigSchema object from it,
 *  or create the file from defaults if it does not exist.
 */
const getOrSetConfig = async function(configDir: string, fileName: string, config: ConfigSchema ): Promise<ConfigSchema> {
	const dirExists = async function(dir: Dir): Promise<void> {
		return fs.promises.lstat(dir.path)
			.then(stats => {
				dir.close();
				if (stats.isDirectory()) {
					return;
				} else {
					throw `${configDir} exists but is not a directory`;
				}
			});
	};
	const dirCreate = async function(): Promise<void> {
		return fs.promises.mkdir(configDir, '0755')
			.catch(() => { throw `Could not create ${configDir}` });
	};
	const openFile = async function(): Promise<ConfigSchema> {
		/* BUG?: flags: 'w+' reports file size incorrectly as 0,
			instead we use the raw Linux kernel mode integer.
			See: http://man7.org/linux/man-pages/man2/open.2.html
			And: fs.constants.
		*/
		return fs.promises.open(`${configDir}/${fileName}`, 66, '0750')
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
									// Copies any values from the config file into the existing config
									/*return Object.assign({}, ...Object.keys(config).map(key =>
										({[key]: (key in contentParsed as any ? contentParsed as any : config)[key]})
                                    )) as ConfigSchema;*/
									return Object.assign({}, ...Object.keys(config).map(key => {
										const newKey = key in contentParsed as any && key !== 'private' ? contentParsed as any : config;
										return {[key]: newKey[key]};
									})) as ConfigSchema;
								})
								.catch(() => { throw `Could not read ${fileName}` });
						} else {
							/* Write default config to file */
							return file.write(Constants.configPreamble + toml.stringify(config as any))
								.then(() => config)
								.catch(() => { throw `Could not write to ${fileName}` });
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

	return fs.promises.opendir(configDir)
		.then(dirExists, dirCreate)
		/* If the dir can't be created (or isn't a dir) the function is thrown */
		.catch(err => { throw err })
		/* Can now handle the actual config file */
		.then(() => openFile())
		/* Error opening the config file */
		.catch(err => { throw err });
};

export default { defaultConfig, getOrSetConfig };