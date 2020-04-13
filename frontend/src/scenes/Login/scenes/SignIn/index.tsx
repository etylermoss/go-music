/* 3rd party imports */
import React from 'react';

/* 1st party imports */

interface SceneProps {
	active: boolean;
}

const Scene = (props: SceneProps): JSX.Element => {
	if (!props.active) return ( <></> );
	
	return (
		<>
			<h2>Sign in</h2>
		</>
	);
};

export default Scene;