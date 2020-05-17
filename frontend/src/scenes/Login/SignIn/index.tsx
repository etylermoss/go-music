/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (props: { active: boolean }): JSX.Element => {

	const store = useContext(StoreContext);
	
	return useObserver(() => {
		if (!props.active) return ( <></> );
		return (
			<>
				<h2>Sign in</h2>
				<p>Username is: {store.user?.username}</p>
			</>
		);
	});
};

export default Scene;