/* 3rd party imports */
import 'mobx-react/batchingForReactDom';
import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import { ApolloProvider, useMutation } from '@apollo/react-hooks';
import { Router, Switch, Route } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { ThemeProvider } from 'theme-ui';

/* 1st party imports */
import '@/style.scss';
import GlobalConfig from '@G/config.json';
import StoreInstance, { StoreContext } from '@/store';
import Theme from '@/theme';

/* 1st party imports - Scenes */
import Splash from '@/scenes/Splash';
import Login from '@/scenes/Login';
import NotFound from '@/scenes/NotFound';
import Dashboard from '@/scenes/Dashboard';
import Admin from '@/scenes/Admin';

/* 1st part imports - GraphQL */
import IsSignedInTag from '@/gql/IsSignedIn';
import IsSignedInTypes from '@/gql/types/IsSignedIn';

/* Get URL with correct port, accounting for Webpack Dev Server port
 * offset, may not work behind reverse proxy.
*/
let port = Number.parseInt(window.location.port);
if (!port && window.location.protocol === 'https:') port = 443;
if (!port && window.location.protocol === 'http:') port = 80;
if (DEVSERVER) port = GlobalConfig.port + GlobalConfig.devServerPortOffset;
const url = `${window.location.protocol}//${window.location.hostname}:${port}`;

/* Launch Apollo Client */
const client = new ApolloClient<InMemoryCache>({
	uri: `${url}/${GlobalConfig.gqlPath}`,
	cache: new InMemoryCache(),
	credentials: 'same-origin',
});

/* Browser history object to use low-level Router */
const history = createBrowserHistory();

const Root = (): JSX.Element => {
	const [isSignedIn] = useMutation<IsSignedInTypes.IsSignedIn>(IsSignedInTag, {client});
	const [loadingIsSignedIn, setloadingIsSignedIn] = useState(true);

	
	useEffect(() => {
		isSignedIn().then(result => {
			if (result.data?.isSignedIn) {
				StoreInstance.updateUser(result.data.isSignedIn);
			} else {
				StoreInstance.updateUser(null);
				history.replace('/');
			}

			setloadingIsSignedIn(false);
		});
	}, []);

	/* This runs later in event loop so must use state */
	if (loadingIsSignedIn) return <>Loading</>;

	return (
		<StoreContext.Provider value={StoreInstance}>
			<ApolloProvider client={client}>
				<ThemeProvider theme={Theme}>
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
							<Route path="/admin">
								<Admin/>
							</Route>
							<Route path="*">
								<NotFound/>
							</Route>
						</Switch>
					</Router>
				</ThemeProvider>
			</ApolloProvider>
		</StoreContext.Provider>
	);
};

render(<Root/>, document.getElementById('root'));