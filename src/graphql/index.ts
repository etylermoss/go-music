/* 3rd party imports */
import path from 'path';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AuthenticationService } from '@/services/authentication';
import { ConfigService } from '@/services/config';

/* 1st party imports - Resolvers */
import AuthResolver from '@/graphql/resolvers/authentication';
import UserResolver from '@/graphql/resolvers/user';
import SourceResolver from '@/graphql/resolvers/source';
import SongResolver from '@/graphql/resolvers/song';
import AlbumResolver from '@/graphql/resolvers/album';

export const launchGraphql = async (): Promise<ApolloServer | null> => {
	
	const config = Container.get(ConfigService).get();

	const apolloOptions: ApolloServerExpressConfig = {
		introspection: !RELEASE,
		debug: !RELEASE,
		uploads: false,
		formatError: (error) => {
			if (
				(error.extensions?.exception?.validationErrors as any[])?.length > 0
				&& error?.extensions?.code
			) {
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
			const authSvc = Container.get(AuthenticationService);
			ctx.userID = authSvc.checkAuthToken(ctx.req.cookies['authToken']);
			return ctx;
		},
	};

	try {
		const schema = await buildSchema({
			resolvers: [AuthResolver, UserResolver, SourceResolver, SongResolver, AlbumResolver],
			emitSchemaFile: config.private.genSchema ? path.resolve(__dirname, '../', 'schema.gql') : false,
			container: Container,
			validate: true,
			dateScalarMode: 'timestamp',
		});

		if (config.private.genSchema) process.exit(0);
	
		return new ApolloServer({ schema, ...apolloOptions });
	} catch (err) {
		console.error('[FATAL ERROR]: ', err);
	}

	return null;
};