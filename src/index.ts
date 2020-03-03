/* 3rd party imports */
import process from 'process';
import fs, { Dir } from 'fs';
import path from 'path';
import xdgBasedir from 'xdg-basedir';
import minimist from 'minimist';
import toml from '@iarna/toml';
import express from 'express';

/* 1st party imports */
import AppApi from './api';

// debug
import util from 'util';
import readline from 'readline';

interface CONFIG {
	dataDir: string;
	port?: number;
}

const EXIT = function(exitCode: number): void {
	console.log(`\nExiting...`);
	process.exit(exitCode);
};
const FATAL_ERROR = function(err: string): void {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: ${err}\x1b[0m`);
	EXIT(1);
};

const DIRS = {
	CLIENT: process.env.release ? path.join(__dirname, '..', '/share/go-music/client') : path.join(__dirname, '/client')
};
/* Extensions seen by the server, 
used when searching for music files / album art,
entries must be lowercase with no . at the start */
const EXTENSION_WHITELIST = [
	'mp3', 'opus', 'ogg', 'wav', 'flac', 'm4a', 'aac',
	'png', 'jpg', 'jpeg', 'bmp', 'gif'
];
const CONFIG_PREAMBLE = `# Go Music: Configuration file.\n
# This file is written in the TOML format.
# Available options: <GITHUB/WIKI>.
# See: https://wikipedia.org/wiki/TOML.\n\n`;
const CONFIG_DEFAULT: CONFIG = {
	dataDir: path.join(xdgBasedir.data, '/go-music'),
	port: 5000
};
let CONFIG_DIR = path.join(xdgBasedir.config, '/go-music');

/* Manage command line arguments */
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
		console.log(`Go Music: Personal music server.

  -c, --config: The directory of the configuration files.
    It will be created if it does not exist, and contain
    go-music.config.toml.
  -p, --port: The port to run the server on. Defaults to ${CONFIG_DEFAULT.port}.
  -h, --help: Print this help message.`);
		process.exit(0);
}

for (const dirPath of [CONFIG_DIR, CONFIG_DEFAULT.dataDir]) {
	if (!path.isAbsolute(dirPath)) {
		FATAL_ERROR(`${dirPath} is not an absolute directory path, for example don't use './'.`);
	}
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

/* Express server */
const app = express();

// Serve static client build
app.use(express.static(path.join(DIRS.CLIENT)));

// Test route
app.get('/getList', (_req, res) => {
	const list = ['item1', 'item2', 'item3'];
	res.json(list);
	console.log('Sent list of items');
});


getOrSetConfig(CONFIG_DIR, `go-music.config.toml`, CONFIG_DEFAULT, CONFIG_PREAMBLE)
	.then(config => {
		console.log('Value of config: ' + util.inspect(config, {showHidden: true, depth: null}));
		console.log(`Listening on port ${config.port}`);
		app.listen(config.port);

		const api = new AppApi(config.dataDir, EXTENSION_WHITELIST);

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.question('Enter new sourceDir path: ', (sourceDirPath) => {
			if (!path.isAbsolute(sourceDirPath)) rl.close();
			api.addSource(path.normalize(sourceDirPath));
			for (;;) {
				rl.question('Would you like to get source info, or quit? (i or q): ', (answer) => {
					if (answer === 'i') {
						rl.question('Getting source info, enter the path: ', answer => {
							console.log(util.inspect(api.getSourceInfo(answer), false, null));
						});
					} else if (answer === 'q') {
						rl.close();
					}
				});
			}
		});

		rl.on('close', () => {
			console.log('Exiting...');
			api.stop();
			process.exit(0);
		});
	})
	.catch(err => {
		FATAL_ERROR(err);
	});