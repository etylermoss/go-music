/* 3rd party imports */
import React from 'react';
import { render } from 'react-dom';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';

/* 1st party imports */
import { Greeting } from './hello';

const client = new ApolloClient({
	uri: 'http://localhost:5000/api/graphql'
});

const Root = (): JSX.Element => (
	<ApolloProvider client={client}>
		<Greeting compiler='TypeScript' framework='React'/>
	</ApolloProvider>
);

render(<Root/>, document.getElementById('root'));