/* 3rd party imports */
import path from 'path';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

/* 3rd party imports - Types only */
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { Response, Request } from 'express';
import { ExecutionParams } from 'subscriptions-transport-ws';

/* 1st party imports */
import { ConfigSchema } from '@/config';
import { FATAL_ERROR, EXIT } from '@/common';
import UserResolver from '@/graphql/resolvers/user';

export interface Context {
	res: Response;
	req: Request;
	connection: ExecutionParams;
}

export const launchGraphql = async (): Promise<ApolloServer> => {

	const config: ConfigSchema = Container.get('config');

	const apolloOptions: ApolloServerExpressConfig = {
		introspection: !RELEASE,
		debug: !RELEASE,
		uploads: false,
		playground: RELEASE ? false : {
			settings: {
				'request.credentials': 'same-origin',
			},
		},
		context: ctx => {
		/* Can mutate context here, set auth level etc */
			return ctx;
		},
	};

	try {
		const schema = await buildSchema({
			resolvers: [UserResolver],
			emitSchemaFile: RELEASE ? false : path.resolve(__dirname, '../', 'schema.gql'),
			container: Container,
		});

		if (config.private.genSchema) EXIT();
	
		return new ApolloServer({ schema, ...apolloOptions });
	} catch (err) {
		FATAL_ERROR(err);
	}
};