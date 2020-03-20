/* 3rd party imports */
import express from 'express';

interface RestOptions {
	path?: string;
	routerOptions?: express.RouterOptions;
}

class RestServer {

	getMiddleware(options?: RestOptions): express.Router {
		const path = options?.path ? options?.path : '/rest';
		const router = express.Router(options.routerOptions);

		router.use(path + '/json', (req, res) => {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(['apples', 'oranges', 'potatoes']));
		});

		router.use(path + '/', (req, res) => {
			res.setHeader('Content-Type', 'text/html');
			res.send('<h2>Hello World!</h2>');
		});

		return router;
	}

}

const launchRest = (): RestServer => {
	const server = new RestServer();
	return server;
};

export { launchRest, RestServer };