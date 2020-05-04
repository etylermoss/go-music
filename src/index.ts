/* 3rd party imports */
import process from 'process';
import path from 'path';
import minimist from 'minimist';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Container } from 'typedi';
import 'reflect-metadata';

/* 1st party imports */
import GlobalConfig from '@G/config.json';
import { FATAL_ERROR, EXIT } from '@/common';
import { defaultConfig, openConfig, ConfigSchema } from '@/config';
import { launchGraphql } from '@/graphql';

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
  -h, --help: Print this help message.`;
};

/** Parse command line arguments supplied to the application,
 *  and apply them to the configuration object.
 */
const manageCliArgs = (config: ConfigSchema): ConfigSchema => {
	const args = minimist(process.argv.slice(2));
	switch(true) {
		// -p, --port: port to run the server on
		case Boolean(args?.p || args?.port):
			config.port = args.p ? args.p : args.port;
			break;
		// -c, --config: config directory path
		case Boolean(args?.c || args?.config):
			config.private.configDirectory = args.c ? args.c : args.config;
			break;
		// -a, --api-only
		case Boolean(args?.a || args['api-only']):
			config.private.apiOnly = true;
			break;
		// -s, --gen-schema
		case Boolean(args?.s || args['gen-schema']):
			config.private.genSchema = true;
			if (RELEASE) FATAL_ERROR('Cannot generate schema with release build.');
			break;
		// -h, --help: print help information
		case Boolean(args?.h || args?.help):
			console.log(getHelpInfo(defaultConfig.port));
			EXIT();
	}
	return config;
};

/** Retrieve the config object and apply supplied CLI arguments to it, if
 *  the config file does not exist it will be created.
 */
const retrieveConfig = async (): Promise<ConfigSchema> => {
	let config = manageCliArgs(defaultConfig);

	arePathsAbsolute((path: string): void => {
		FATAL_ERROR(`${path} is not an absolute directory path.`);	
	},
	config.dataDirectory,
	config.private.configDirectory,
	config.private.frontendDirectory,
	);

	try {
		config = await openConfig(path.join(config.private.configDirectory, 'go-music.config.toml'), config);
	} catch(err) {
		FATAL_ERROR(err);
	}

	return config;
};

/** Entrypoint into the application
 */
const main = async (): Promise<void> => {

	const config = await retrieveConfig();

	/* Store configuration in Typedi container */
	Container.set('config', config);

	/* Initialize express server */
	const app = express();

	/* Add cookie support */
	app.use(cookieParser());

	/* Serve Graphql */
	const graphql = await launchGraphql();
	app.use(`/${GlobalConfig.gqlPath}`, graphql.getMiddleware({path: '/', cors: false}));

	/* Serve Frontend */
	if (!config.private.apiOnly) {
		const staticServe = express.static(path.resolve(config.private.frontendDirectory));
		/* Serve frontend on all paths, as it handles routing */
		app.use('/', staticServe);
		app.use('/*', staticServe);
	}

	/* Start listening for HTTP requests */
	app.listen(config.port);

	console.log(
		`Now running at http://localhost:${config.port}.`,
		(RELEASE ? undefined :
		`Audio API at /${GlobalConfig.audioApiPath}, GraphQL Endpoint at /${GlobalConfig.gqlPath}.`
		),
	);
};

main();