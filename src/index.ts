/* 3rd party imports */
import process from 'process';
import path from 'path';
import minimist from 'minimist';
import express from 'express';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { Container } from 'typedi';

/* 1st party imports */
import GlobalConfig from '@G/config.json';
import { FATAL_ERROR, EXIT } from '@/common';
import { defaultConfig, openConfig, ConfigSchema } from '@/config';
import { launchGraphql } from '@/graphql';

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

let config: ConfigSchema = defaultConfig;

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
			FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
		}, config.private.configDirectory);
		break;
	// -a, --api-only
	case Boolean(args?.a || args['api-only']):
		config.private.apiOnly = true;
		break;
	// -s, --gen-schema
	case Boolean(args?.s || args['gen-schema']):
		config.private.genSchema = true;
		break;
	// -h, --help: print help information
	case Boolean(args?.h || args?.help):
		console.log(getHelpInfo(config.port));
		EXIT();
}

const main = async (): Promise<void> => {

	/* Open config file (or write default config to it if it does not exist) */
	try {
		config = await openConfig(path.join(config.private.configDirectory, 'go-music.config.toml'), config);
	} catch(err) {
		FATAL_ERROR(err);
	}

	/* Ensures directories specified in config are absolute, so can always be resolved */
	arePathsAbsolute((path: string): void => {
		FATAL_ERROR(`${path} is not an absolute directory path, for example don't use './'.`);	
	}, config.dataDirectory);

	/* Store configuration in IoC container so it can be accessed anywhere */
	Container.set('config', config);

	/* Initialize express server */
	const app = express();

	/* Add cookie support */
	app.use(cookieParser());

	/* Serve Graphql */
	const graphql = await launchGraphql(config);
	app.use(`/${GlobalConfig.gqlPath}`, graphql.getMiddleware({path: '/', cors: false}));

	/* Serve Frontend */
	if (!config.private.apiOnly) {
		const staticServe = express.static(path.resolve(config.private.frontendDirectory));
		/* Serve the static directory no matter the path, lets the frontend handle routing */
		app.use('/', staticServe);
		app.use('/*', staticServe);
	}

	/* Start listening for HTTP requests */
	app.listen(config.port);

	console.log(`Now running at http://localhost:${config.port}, audio api at /${GlobalConfig.audioApiPath}, gql at /${GlobalConfig.gqlPath}.`);
};

main();