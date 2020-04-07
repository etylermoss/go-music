/* 3rd party imports */
import process from 'process';
import path from 'path';
import minimist from 'minimist';
import express from 'express';

/* 1st party imports */
import globalConfig from 'go-music/global-config';
import Constants from 'go-music/constants';
import { defaultConfig, openConfig, ConfigSchema } from 'go-music/config';
import Api from 'go-music/api';

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

const config = defaultConfig;

/* Manage command line arguments */
const args = minimist(process.argv.slice(2));
switch(true) {
	// -p, --port: port to run the server on
	case Boolean(args?.p || args?.port):
		config.port = args.p ? args.p : args.port;
		break;
	// -c, --config: config directory path
	case Boolean(args?.c || args?.config):
		config.private.configDirectory = args.c ? args.c : args.config;
		arePathsAbsolute((path: string) => {
			Constants.FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
		}, config.private.configDirectory);
		break;
	// -a, --api-only
	case Boolean(args?.a || args['api-only']):
		config.private.apiOnly = true;
		break;
	// -h, --help: print help information
	case Boolean(args?.h || args?.help):
		console.log(Constants.getHelpInfo(config.port));
		Constants.EXIT();
}



const launch = async (): Promise<void> => {

	/* Open config file (or write default config to it if it does not exist) */
	let newConfig: ConfigSchema;
	try {
		newConfig = await openConfig(path.join(config.private.configDirectory, 'go-music.config.toml'), config);
	} catch(err) {
		Constants.FATAL_ERROR(err);
	}

	arePathsAbsolute((path: string) => {
		Constants.FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
	}, newConfig.dataDirectory);

	/* Initialize express server */
	const app = express();

	/* Serve backend api */
	app.use(globalConfig.apiPath, new Api(newConfig).getMiddleware());

	/* Serve frontend */
	if (!config.private.apiOnly) {
		const staticServe = express.static(path.resolve(config.private.frontendDirectory));
		/* Serve the static directory no matter the path, lets the frontend handle routing */
		app.use('/', staticServe);
		app.use('/*', staticServe);
	}

	/* Start listening for HTTP requests */
	app.listen(newConfig.port);

	console.log(`Now running at http://localhost:${config.port}, api at ${globalConfig.apiPath}.`);
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