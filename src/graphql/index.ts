/* 3rd party imports */
import path from 'path';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';

/* 1st party imports */
import Context from '@/context';
import { ConfigSchema } from '@/config';

/* 1st party imports - Services */
import { LoggerService } from '@/services/logger';
import { AuthenticationService } from '@/services/authentication';

/* 1st party imports - Resolvers */
import AuthResolver from '@/graphql/resolvers/authentication';
import UserResolver from '@/graphql/resolvers/user';

export const launchGraphql = async (): Promise<ApolloServer> => {

	const config: ConfigSchema = Container.get('config');
	const logSvc: LoggerService = Container.get('logger.service');

	const apolloOptions: ApolloServerExpressConfig = {
		introspection: !RELEASE,
		debug: !RELEASE,
		uploads: false,
		formatError: (error) => {
			if ((error.extensions?.exception?.validationErrors as any[]).length > 0) {
				error.extensions.code = 'ARGUMENT_VALIDATION_ERROR';
			}
			return error;
		},
		playground: RELEASE ? false : {
			settings: {
				'request.credentials': 'same-origin',
				'schema.polling.enable': false,
			} as any,
		},
		context: (ctx: Context) => {
			const authSvc: AuthenticationService = Container.get('authentication.service');
			ctx.user_id = authSvc.checkAuthToken(ctx.req.cookies['authToken']);
			return ctx;
		},
	};

	try {
		const schema = await buildSchema({
			resolvers: [AuthResolver, UserResolver],
			emitSchemaFile: config.private.genSchema ? path.resolve(__dirname, '../', 'schema.gql') : false,
			container: Container,
			validate: true,
		});

		if (config.private.genSchema) process.exit(0);
	
		return new ApolloServer({ schema, ...apolloOptions });
	} catch (err) {
		logSvc.log('FATAL_ERROR', err);
	}
};