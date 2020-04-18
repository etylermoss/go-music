/* 3rd party imports */
import path from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';

/* 3rd party imports - Types only */
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { Database } from 'better-sqlite3';
import { Response, Request } from 'express';
import { ExecutionParams } from 'subscriptions-transport-ws';

/* 1st party imports */
import UserResolver from '@/api/graphql/resolvers/user';
import AuthResolver from '@/api/graphql/resolvers/auth';

export interface Context {
	res: Response;
	req: Request;
	connection: ExecutionParams;
}

export const launchGraphql = async (db: Database): Promise<ApolloServer> => {
	const apolloOptions: ApolloServerExpressConfig = {
		playground: !RELEASE,
		introspection: !RELEASE,
		debug: !RELEASE,
		uploads: false,
	};

	const schema = await buildSchema({
		resolvers: [UserResolver, AuthResolver],
		emitSchemaFile: RELEASE ? false : path.resolve(__dirname, 'schema.gql'),
	});

	return new ApolloServer({ schema, ...apolloOptions });
};