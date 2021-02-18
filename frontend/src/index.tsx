/* 3rd party imports */
import React, { useEffect } from 'react';
import { render } from 'react-dom';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import { ApolloProvider, useMutation } from '@apollo/react-hooks';
import { Router, Switch, Route } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import 'mobx-react/batchingForReactDom';

/* 1st party imports */
import GlobalConfig from '@G/config.json';
import StoreInstance, { StoreContext } from '@/store';

/* 1st party imports - Scenes */
import Splash from '@/scenes/Splash';
import Login from '@/scenes/Login';
import Dashboard from '@/scenes/Dashboard';
import NotFound from '@/scenes/NotFound';

/* 1st part imports - GraphQL */
import IsSignedInTag from '@/gql/IsSignedIn';
import IsSignedInTypes from '@/gql/types/IsSignedIn';

/* Get URL with correct port, accounting for Webpack Dev Server port
 * offset, may not work behind reverse proxy.
*/
let port = Number.parseInt(window.location.port);
if (!port && window.location.protocol === 'https:') port = 443;
if (!port && window.location.protocol === 'http:') port = 80;
if (DEVSERVER) port = port - GlobalConfig.devServerPortOffset;
const url = `${window.location.protocol}//${window.location.hostname}:${port}`;

/* Launch Apollo Client */
const client = new ApolloClient({
	uri: `${url}/${GlobalConfig.gqlPath}`,
	cache: new InMemoryCache(),
	credentials: DEVSERVER ? 'include' : 'same-origin',
});

/* Browser history object to use low-level Router */
const history = createBrowserHistory();

const Root = (): JSX.Element => {

	const [isSignedIn] = useMutation<IsSignedInTypes.IsSignedIn>(
		IsSignedInTag,
		{client: client as ApolloClient<object>},
	);
	
	useEffect(() => {
		isSignedIn().then(result => {
			if (result.data?.isSignedIn?.details) {
				const { user_id, username, details } = result.data?.isSignedIn;
				StoreInstance.updateUser({ user_id, username, details });
				history.push('/dashboard');
			} else {
				StoreInstance.updateUser(null);
				history.replace('/'); // get store.user from localstorage
			}
		});
	}, []);

	return (
		<StoreContext.Provider value={StoreInstance}>
			<ApolloProvider client={client}>
				<Router history={history}>
					<Switch>
						<Route exact path="/">
							<Splash loginPath="/login"/>
						</Route>
						<Route path="/login">
							<Login/>
						</Route>
						<Route path="/dashboard">
							<Dashboard/>
						</Route>
						<Route path="*">
							<NotFound/>
						</Route>
					</Switch>
				</Router>
			</ApolloProvider>
		</StoreContext.Provider>
	);
};

render(<Root/>, document.getElementById('root'));