/* 3rd party imports */
import React, { useState, useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import { StoreContext } from '@/store';

/* 1st part imports - GraphQL */
import signUpTag from '@/scenes/Login/SignUp/gql/SignUp';
import signUpTypes from '@/scenes/Login/SignUp/gql/types/SignUp';

const Scene = (props: { active: boolean }): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const [user, setUser] = useState({
		realName: '',
		username: '',
		password: '',
		email: '',
	});

	const updateUser = (evt: React.ChangeEvent<HTMLInputElement>): void => setUser({
		...user,
		[evt.target.name]: evt.target.value,
	});

	const [signUp] = useMutation<signUpTypes.SignUp>(signUpTag);

	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const signUpVars: signUpTypes.SignUpVariables = {
			data: {
				username: user.username,
				password: user.password,
				details: {
					realName: user.realName,
					email: user.email,
				},
			},
		};
		signUp({variables: { data: signUpVars.data }})
			.then(({data}) => {
				if (data?.signUp?.details) {
					store.updateUser(data.signUp);
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
					<input name="realName" type="text" placeholder="Your name"
						value={user.realName}
						onChange={evt => updateUser(evt)}
					/>
					<p>
						Must contain only latin characters, apostrophes, hyphens, and spaces.
					</p>
					<input name="username" type="text" placeholder="Username"
						value={user.username}
						onChange={evt => updateUser(evt)}
					/>
					<p>
						Must be between 3 and 24 characters long.
						You can use letters, numbers, underscore and hyphen.
					</p>
					<input name="password" type="password" placeholder="Password"
						value={user.password}
						onChange={evt => updateUser(evt)}
					/>
					<p>
						Must be at least 8 characters long.
						You can use letters, numbers, and common symbols.
					</p>
					<input name="email" type="email" placeholder="Email"
						value={user.email}
						onChange={evt => updateUser(evt)}
					/>
					<p>
						Must be a valid email address.
					</p>
					<input type="submit" value="Submit"/>
				</form>
			</>
		);
	});
};

export default Scene;