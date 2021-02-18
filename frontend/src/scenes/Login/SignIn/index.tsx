/* 3rd party imports */
import React, { useContext, useState } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

/* 1st part imports - GraphQL */
import signInTag from '@/scenes/Login/SignIn/gql/SignIn';
import signInTypes from '@/scenes/Login/SignIn/gql/types/SignIn';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (props: { active: boolean }): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const [user, setUser] = useState({
		username: '',
		password: '',
	});

	const updateUser = (evt: React.ChangeEvent<HTMLInputElement>): void => setUser({
		...user,
		[evt.target.name]: evt.target.value,
	});

	const [signIn] = useMutation<signInTypes.SignIn>(signInTag);

	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		signIn({variables: { data: user }})
			.then(({data}) => {
				if (data?.signIn?.details) {
					const { user_id, username, details } = data?.signIn;
					store.updateUser({ user_id, username, details });
					history.push('/dashboard');
				}
			});
	};

	return useObserver(() => {
		if (!props.active) return ( <></> );
		return (
			<>
				<h2>Sign in</h2>
				<form onSubmit={submit}>
					<input name="username" type="text" placeholder="Username"
						value={user.username}
						onChange={evt => updateUser(evt)}
					/>
					<input name="password" type="password" placeholder="Password"
						value={user.password}
						onChange={evt => updateUser(evt)}
					/>
					<input type="submit" value="Submit"/>
				</form>
			</>
		);
	});
};

export default Scene;