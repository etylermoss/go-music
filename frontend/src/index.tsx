/* 3rd party imports */
import React from 'react';
import { render } from 'react-dom';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router } from 'react-router-dom';

/* 1st party imports */
import globalConfig from 'globalConfig';
import { Greeting } from './hello';

const client = new ApolloClient({
	uri: `http://${window.location.host}/${globalConfig.apiPath}/graphql`
});

const Root = (): JSX.Element => (
	<ApolloProvider client={client}>
		<Router>
			<Greeting compiler='TypeScript' framework='React'/>
		</Router>
	</ApolloProvider>
);

render(<Root/>, document.getElementById('root'));