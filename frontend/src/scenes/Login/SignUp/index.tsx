/* 3rd party imports */
import React, { useState } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';

/* 1st party imports */
import { SignedInFunc } from '@/scenes/Login';

/* 1st part imports - GraphQL */
import signUpTag from '@/scenes/Login/SignUp/gql/SignUp';
import signUpTypes from '@/scenes/Login/SignUp/gql/types/SignUp';

interface SignUpProps {
	active: boolean;
	signedIn: SignedInFunc;
}

const Component = ({active, signedIn}: SignUpProps): JSX.Element => {
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

	const [signUp] = useMutation<signUpTypes.SignUp, signUpTypes.SignUpVariables>(signUpTag);

	const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();

		const result = await signUp({ variables: { data: {
			username: user.username,
			password: user.password,
			details: {
				realName: user.realName,
				email: user.email,
			},
		}}});

		if (result?.data?.signUp?.details) {
			const { userID, username, adminPriority, details } = result.data.signUp;
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

export default Component;