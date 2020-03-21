/* 3rd party imports */
import express from 'express';

class RestServer {

	getMiddleware(options?: express.RouterOptions): express.Router {
		const router = express.Router(options);

		router.use('/json', (req, res) => {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(['apples', 'oranges', 'potatoes']));
		});

		router.use('/', (req, res) => {
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