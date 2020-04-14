/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';

/* 1st party imports */
import { StoreContext } from '@/store';

interface SceneProps {
	active: boolean;
}

const Scene = (props: SceneProps): JSX.Element => {

	const store = useContext(StoreContext);
	
	return useObserver(() => {
		if (!props.active) return ( <></> );
		return (
			<>
				<h2>Sign in</h2>
				<p>Token is: {store.token}</p>
			</>
		);
	});
};

export default Scene;