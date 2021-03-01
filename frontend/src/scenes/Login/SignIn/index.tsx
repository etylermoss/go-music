/* 3rd party imports */
import React, { useState } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';

/* 1st party imports */
import { SignedInFunc } from '@/scenes/Login';

/* 1st part imports - GraphQL */
import signInTag from '@/scenes/Login/SignIn/gql/SignIn';
import signInTypes from '@/scenes/Login/SignIn/gql/types/SignIn';

interface SignInProps {
	active: boolean;
	signedIn: SignedInFunc;
}

const Component = ({active, signedIn}: SignInProps): JSX.Element => {
	const [user, setUser] = useState({
		username: '',
		password: '',
	});

	const updateUser = (evt: React.ChangeEvent<HTMLInputElement>): void => setUser({
		...user,
		[evt.target.name]: evt.target.value,
	});

	const [signIn] = useMutation<signInTypes.SignIn>(signInTag);

	const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();

		const result = await signIn({ variables: { data: {
			username: user.username,
			password: user.password,
		}}});

		if (result.data?.signIn?.details) {
			const { userID, username, adminPriority, details } = result.data.signIn;
			signedIn({
				userID,
				username,
				adminPriority,
				details,
			});
		}
	};

	return useObserver(() => {
		if (!active) return ( <></> );
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

export default Component;