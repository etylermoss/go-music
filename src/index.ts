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
import { LoggerService } from '@/logger';
import { defaultConfig, openConfig, ConfigSchema } from '@/config';
import { launchGraphql } from '@/graphql';

/** Print exit message and exit program execution.
 *  Accepts process exit code, defaults to 0.
 */
const Exit = (exitCode: number = 0, ...msg: string[]): void => {
	if (msg.length > 0) console.log(...msg);
	console.log(`\nExiting...`);
	process.exit(exitCode);
};

/** Prints error message and then exits the program
 *  by calling EXIT().
 */
const FatalError = (...err: any[]): void => {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: `, ...err, `\x1b[0m`);
	Exit(1);
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

/** Parse command line arguments supplied to the application,
 *  and apply them to the configuration object.
 */
const manageCliArgs = (config: ConfigSchema): ConfigSchema => {
	const args = minimist(process.argv.slice(2));
	switch(true) {
		// -c, --config: config directory path
		case Boolean(args?.c || args?.config):
			config.private.configDirectory = args.c ? args.c : args.config;
			break;
		// -p, --port: port to run the server on
		case Boolean(args?.p || args?.port):
			config.port = args.p ? args.p : args.port;
			break;
		// -l, --log-level: logging verbosity level (0-4)
		case Boolean(args?.l || args['log-level']):
			config.logLevel = args.l ? args.l : args['log-level'];
			if (RELEASE && config.logLevel === 4) {
				FatalError('This log level is not allowed with Release builds.');
			}
			break;
		// -L, --log-file: file path to output logs to
		case Boolean(args?.L || args['log-file']):
			config.logFile = args.L ? args.L : args['log-file'];
			break;
		// -a, --api-only: don't serve frontend
		case Boolean(args?.a || args['api-only']):
			config.private.apiOnly = true;
			break;
		// -s, --gen-schema
		case Boolean(args?.s || args['gen-schema']):
			config.private.genSchema = true;
			if (RELEASE) FatalError('Cannot generate schema with Release builds.');
			break;
		// -h, --help: print help information
		case Boolean(args?.h || args?.help):
			console.log(getHelpInfo(defaultConfig.port));
			Exit();
	}
	return config;
};

/** Retrieve the config object and apply supplied CLI arguments to it, if
 *  the config file does not exist it will be created.
 */
const retrieveConfig = async (): Promise<ConfigSchema> => {
	let config = manageCliArgs(defaultConfig);

	arePathsAbsolute((path: string): void => {
		FatalError(`${path} is not an absolute directory path.`);	
	},
	config.dataDirectory,
	config.private.configDirectory,
	config.private.frontendDirectory,
	);

	try {
		config = await openConfig(path.join(config.private.configDirectory, 'go-music.config.toml'), config);
	} catch(err) {
		FatalError(err);
	}

	return config;
};

/** Entrypoint into the application
 */
const main = async (): Promise<void> => {

	const config = await retrieveConfig();

	/* Store configuration in Typedi container */
	Container.set('config', config);

	const logger: LoggerService = Container.get('logger.service');

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

	logger.log('INFO',
		`Now running at http://localhost:${config.port}.`,
		(RELEASE ? undefined :
		`Audio API at /${GlobalConfig.audioApiPath}, GraphQL Endpoint at /${GlobalConfig.gqlPath}.`
		),
	);
};

main();