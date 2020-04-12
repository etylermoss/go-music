/* 3rd party imports */
import React from 'react';
import { render } from 'react-dom';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

/* 1st party imports */
import globalConfig from 'globalConfig';
import StoreInstance, { StoreContext } from '@/store';

/* 1st party imports - Scenes */
import Login from '@/scenes/Login';
import NotFound from '@/scenes/NotFound';
import Home from '@/scenes/Home';

/* Get URL with correct port, accounting for Webpack Dev Server port offset */
let port = Number.parseInt(window.location.port);
if (!port && window.location.protocol === 'https:') port = 443;
if (!port && window.location.protocol === 'http:') port = 80;
if (DEVSERVER) port = port - globalConfig.devServerPortOffset;
const url = `${window.location.protocol}//${window.location.hostname}:${port}`;

/* Launch Apollo Client */
const client = new ApolloClient({
	uri: `${url}/${globalConfig.apiPath}/${globalConfig.apiGqlPath}`
});


const Root = (): JSX.Element => (
	<StoreContext.Provider value={StoreInstance}>
		<ApolloProvider client={client}>
			<Router>
				<Switch>
					<Route exact path="/">
						<Home compiler='TypeScript' framework='React'/>
					</Route>
					<Route path="/login">
						<Login/>
					</Route>
					<Route path="*">
						<NotFound/>
					</Route>
				</Switch>
			</Router>
		</ApolloProvider>
	</StoreContext.Provider>
);

render(<Root/>, document.getElementById('root'));