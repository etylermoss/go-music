/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (): JSX.Element => {
	const store = useContext(StoreContext);

	return useObserver(() => (
		<>
			<h1>You are logged in!</h1>
			<h2>You are: <b>{store.user?.username}</b></h2>
		</>
	));
};

export default Scene;