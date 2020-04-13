/* 3rd party imports */
import React, { useState } from 'react';

/* 1st party imports */
import Validation from '@G/validation';
import DetailsInput from '@/scenes/Login/components/DetailsInput';

interface SceneProps {
	active: boolean;
}


const Scene = (props: SceneProps): JSX.Element => {

	if (!props.active) return ( <></> );

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const [usernameValidity, setUsernameValidity] = useState(false);
	const [passwordValidity, setPasswordValidity] = useState(false);

	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		console.log(`Submitting: u/${username}, p/${password}`);
		event.preventDefault();
	};


	return (
		<>
			<h2>Register</h2>
			<form onSubmit={submit}>
				<DetailsInput name="username" type="text" placeholder="Username"
					value={username}
					validation={Validation.username}
					valid={setUsernameValidity}
					onChange={evt => setUsername(evt.target.value)}>
					Must be between 3 and 24 characters long.
					You can use letters, numbers, underscore and hyphen.
				</DetailsInput>
				<DetailsInput name="password" type="password" placeholder="Password"
					value={password}
					validation={Validation.password}
					valid={setPasswordValidity}
					onChange={evt => setPassword(evt.target.value)}>
					Must be at least 5 characters long.
					You can use letters, numbers, and most of the common symbols.
				</DetailsInput>
				<input type="submit" value="Submit" disabled={usernameValidity && passwordValidity ? false : true}/>
			</form>
		</>
	);
};

export default Scene;