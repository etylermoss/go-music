/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (): JSX.Element => {
	const store = useContext(StoreContext);

	return useObserver(() => (
		<>
			<h1>You are an admin with priority: {store.user?.adminPriority}</h1>
		</>
	));
};

export default Scene;