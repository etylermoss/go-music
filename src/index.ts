/* 3rd party imports */
import process from 'process';
import path from 'path';
import minimist from 'minimist';
import express from 'express';

/* 1st party imports */
import Constants from 'go-music/constants';
import Config, { ConfigSchema } from 'go-music/config';
import Api from 'go-music/api';

/* Debug */
import util from 'util';

/** Checks whether the provided paths[] are absolute,
 *  i.e they always resolve to the same location
 *  regardless of the working directory.
 */
const arePathsAbsolute = (callback: any, ...paths: string[]): any => {
	for (const dirPath of paths) {
		if (!path.isAbsolute(dirPath)) {
			return callback(dirPath);
		}
	}
};

const config = Config.defaultConfig;

/* Manage command line arguments */
const args = minimist(process.argv.slice(2));
switch(true) {
	// -p, --port: port to run the server on
	case (args?.p || args?.port):
		config.port = args.p ? args.p : args.port;
		break;
	// -c, --config: config directory path
	case (args?.c || args?.config):
		config.private.configDirectory = args.c ? args.c : args.config;
		arePathsAbsolute((path: string) => {
			Constants.FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
		}, config.private.configDirectory);
		break;
	// -h, --help: print help information
	case (args?.h || args?.help):
		console.log(Constants.getHelpInfo(config.port));
		Constants.EXIT();
}

/* Express server */
const app = express();

/* Serve built client frontend statically */
app.use(express.static(path.join(config.private.clientDirectory), {dotfiles: 'ignore'}));

const launch = async (): Promise<void> => {
	let newConfig: ConfigSchema;
	try {
		newConfig = await Config.getOrSetConfig(config.private.configDirectory, 'go-music.config.toml', config);
		// debug
		console.log('Value of config: ' + util.inspect(newConfig, {showHidden: true, depth: null}));
		console.log(`Listening on port ${config.port}`);
	} catch(err) {
		Constants.FATAL_ERROR(err);
	}

	arePathsAbsolute((path: string) => {
		Constants.FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
	}, newConfig.dataDirectory);

	const api = new Api(newConfig);

	app.use('/api', api.getMiddleware());

	app.listen(newConfig.port);
};

launch();

/* Run steps:
/ Start server (main)
/ Manage configuration (config)
/ Call api (main)
/ Load SQLite (api)
/ Scan directory tree for changes, compare XML (api)
Update DB to reflect tree changes (api)
Scan & Parse new files to get metadata (api/tags C++ Node Addon using tagparser)
Load Graphql pulling from SQLite, serve on /api/graphql (api)
*/