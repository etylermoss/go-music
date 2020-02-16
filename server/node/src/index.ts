import process from 'process';
import fs, { Dir } from 'fs';
import xdgBasedir from 'xdg-basedir';
import minimist from 'minimist';
import toml from '@iarna/toml';

// debug
import util from 'util';

interface CONFIG {
	dataDir: string;
	port?: number;
}

/* Manage command line arguments */

const FATAL_ERROR = function(err: string): void {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: ${err}\x1b[0m\n\nExiting...`);
	process.exit(1);
};
const APPNAME = 'go-music';
const APPNAME_PRETTY = 'Go Music';
const CONFIG_PREAMBLE = `# ${APPNAME_PRETTY}: Configuration file.\n
# This file is written in the TOML format.
# Available options: <GITHUB/WIKI>.
# See: https://wikipedia.org/wiki/TOML.\n\n`;
const CONFIG_DEFAULT: CONFIG = {
	dataDir: `${xdgBasedir.data}/${APPNAME}`,
	port: 5000
};
let CONFIG_DIR = `${xdgBasedir.config}/${APPNAME}`;

const args = minimist(process.argv.slice(2));
switch(true) {
	// -p, --port: port to run the server on
	case (args?.p || args.port):
		CONFIG_DEFAULT.port = args.p ? args.p : args.port;
		break;
	// -c, --config: config directory path
	case (args?.c || args.config):
		CONFIG_DIR = args.c ? args.c : args.config;
		break;
	// -h, --help: print help information
	case (args?.h || args?.help):
		console.log(`${APPNAME_PRETTY}: Personal music server.

  -c, --config: The directory of the configuration files.
    It will be created if it does not exist, and contain
    ${APPNAME}.config.toml.
  -p, --port: The port to run the server on. Defaults to ${CONFIG_DEFAULT.port}.
  -h, --help: Print this help message.`);
		process.exit(0);
}

/** Load config file, or create it from defaults if it doesn't exist **/

const getOrSetConfig = async function(configDir: string, fileName: string, config: CONFIG, configPreamble: string ): Promise<CONFIG> {
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
	const openFile = async function(): Promise<CONFIG> {
		/* [BUG?] flags: 'w+' reports file size incorrectly as 0,
			instead we use the raw Linux kernel mode integer.
			See: http://man7.org/linux/man-pages/man2/open.2.html
			And: fs.constants.
		*/
		return fs.promises.open(`${configDir}/${fileName}`, 66, '0750')
			.then(async file => {
				// Get file information
				return file.stat()
					.then(async stats => {
						// Check if the file is empty
						if (stats.size !== 0) {
							// Read config from file
							return file.readFile('utf8')
								.then(content => toml.parse(content))
								.then(contentParsed => {
									/* Copies any values from the config file into the default config schema */
									return Object.assign({}, ...Object.keys(config).map(key =>
										({[key]: (key in contentParsed as any ? contentParsed as any : config)[key]})
									)) as CONFIG;
								})
								.catch(() => { throw `Could not read ${fileName}` });
						} else {
							// Write default config to file
							return file.write(configPreamble + toml.stringify(config as any))
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
		// If the dir can't be created (or isn't a dir) the function is thrown
		.catch(err => { throw err })
		// Can now handle the actual config file
		.then(() => openFile())
		.catch(err => { throw err });
};

getOrSetConfig(CONFIG_DIR, `${APPNAME}.config.toml`, CONFIG_DEFAULT, CONFIG_PREAMBLE)
	.then(val => console.log('Value of config: ' + util.inspect(val, {showHidden: true, depth: null})))
	.catch(err => {
		FATAL_ERROR(err);
	});
