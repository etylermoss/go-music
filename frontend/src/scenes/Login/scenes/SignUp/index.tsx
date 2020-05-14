/* 3rd party imports */
import React, { useState, useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import Validation from '@G/validation';
import { StoreContext } from '@/store';
import DetailsInput from '@/scenes/Login/components/DetailsInput';

/* 1st part imports - GraphQL */
import signUpTag from '@/scenes/Login/scenes/SignUp/gql/SignUp';
import signUpTypes from '@/scenes/Login/scenes/SignUp/gql/types/SignUp';

const Scene = (props: { active: boolean }): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const [user, setUser] = useState({
		username: '',
		password: '',
		details: {
			email: 'ajjy@email.io',
			real_name: 'notme',
		},
	});

	const updateUser = (evt: React.ChangeEvent<HTMLInputElement>): void => setUser({
		...user,
		[evt.target.name]: evt.target.value,
	});

	const [usernameValidity, setUsernameValidity] = useState(false);
	const [passwordValidity, setPasswordValidity] = useState(false);

	const [signUp] = useMutation<signUpTypes.SignUp>(signUpTag);

	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		signUp({variables: { data: user }})
			.then(({data}): void => {
				if (data?.signUp?.details) {
					const { user_id, username, details } = data?.signUp;
					store.updateUser({ user_id, username, details });
					history.push('/dashboard');
				}
			});
	};

	return useObserver(() => {
		if (!props.active) return ( <></> );
		return (
			<>
				<h2>Register</h2>
				<form onSubmit={submit}>
					<DetailsInput name="username" type="text" placeholder="Username"
						value={user.username}
						validation={Validation.username}
						valid={setUsernameValidity}
						onChange={evt => updateUser(evt)}>
						Must be between 3 and 24 characters long.
						You can use letters, numbers, underscore and hyphen.
					</DetailsInput>
					<DetailsInput name="password" type="password" placeholder="Password"
						value={user.password}
						validation={Validation.password}
						valid={setPasswordValidity}
						onChange={evt => updateUser(evt)}>
						Must be at least 8 characters long.
						You can use letters, numbers, and common symbols.
					</DetailsInput>
					<input type="submit" value="Submit"
						disabled={usernameValidity && passwordValidity ? false : true}
					/>
				</form>
			</>
		);
	});
};

export default Scene;