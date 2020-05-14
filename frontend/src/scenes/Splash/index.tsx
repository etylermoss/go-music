/* 3rd party imports */
import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
	loginPath: string;
}

const Scene = (props: Props): JSX.Element => {
	return (
		<>
			<h1>Go Music - Splash page</h1>
			<p>This is a really cool page, but if you log in it will be even better!</p>
			<Link to={props.loginPath}>Login / Register</Link>
		</>
	);
};

export default Scene;