/* 3rd party imports */
import process from 'process';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Container } from 'typedi';
import 'reflect-metadata';

/* 1st party imports */
import GlobalConfig from '@G/config.json';
import { launchGraphql } from '@/graphql';
import { mediaAPIRouter } from '@/media';
import { ConfigService } from '@/services/config';

const main = async (): Promise<void> => {
	/* Store configuration in Typedi container */
	const confSvc = Container.get(ConfigService);
	await confSvc.generateConfig('go-music.config.toml', process.argv.slice(2));
	const config = confSvc.get();

	/* Initialize express server */
	const app = express();

	/* Add cookie support */
	app.use(cookieParser());

	/* Serve Graphql */
	const graphql = await launchGraphql();
	if (!graphql) return; // FatalError('Could not launch GraphQL.'); // TODO: Should be FatalError but not found by tsc
	app.use(`/${GlobalConfig.gqlPath}`, graphql.getMiddleware({path: '/', cors: !RELEASE}));

	/* Serve Media API */
	app.use(`/${GlobalConfig.mediaPath}`, mediaAPIRouter);

	/* Serve Frontend */
	if (!config.private.apiOnly) {
		const staticServe = express.static(path.resolve(config.private.frontendDirectory));
		/* Serve frontend on all paths, as it handles routing */
		app.use('/', staticServe);
		app.use('/*', staticServe);
	}

	/* Start listening for HTTP requests */
	app.listen(config.port);

	console.log(`Now running at http://localhost:${config.port}`);
	console.log(`GraphQL API at /${GlobalConfig.gqlPath}`);
	console.log(`Media API at /${GlobalConfig.mediaPath}`);
};

main();