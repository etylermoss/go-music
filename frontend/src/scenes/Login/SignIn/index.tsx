/* 3rd party imports */
import React, { useState, useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';
import { GraphQLError } from 'graphql';
import { ValidationError } from 'class-validator';

/* 1st party imports */
import { StoreContext } from '@/store';

/* 1st part imports - GraphQL */
import signInTag from '@/scenes/Login/SignIn/gql/SignIn';
import signInTypes from '@/scenes/Login/SignIn/gql/types/SignIn';

const [ValidatedInput, InvalidDisplay];

const getValidationErrors = (errors: GraphQLError | GraphQLError[]): ValidationError | void => {
	const getErrors = (error: GraphQLError): ValidationError => error?.extensions?.exception?.validationErrors;
	if (Array.isArray(errors)) {

	} else {

	}
}

interface ValidInputProperties {
	gqlName: string,
	value: string,
	isValid: boolean | null,
	errors: string[] | null,
}

const Scene = (props: { active: boolean }): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const [formState, setFormState] = useState<Record<string, ValidInputProperties>>({
		username: { gqlName: 'username', value: '', isValid: null, errors: null },
		password: { gqlName: 'password', value: '', isValid: null, errors: null },
	})

	const updateFormValue = (evt: React.ChangeEvent<HTMLInputElement>): void => setFormState({
		...formState,
		[evt.target.name]: { ...formState[evt.target.name], value: evt.target.value },
	});

	const [signIn] = useMutation<signInTypes.SignIn, signInTypes.SignInVariables>(signInTag);

	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		event.target
		signIn({variables: { data: {
			username: formState.username.value,
			password: formState.password.value,
		}}})
			.then(({data, errors}) => {
				const validationErrors = errors?.filter(error => error?.extensions?.code === 'ARGUMENT_VALIDATION_ERROR');
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
				<p>Username is: {store.user?.username}</p>
				<form onSubmit={submit}>
					<ValidatedInput name="username" type="text" placeholder="Username"
						value={formState.username} onChange={evt => updateFormValue(evt)}
						indicateInvalid={formState.username.isValid}
					/>
					<ValidatedInput indicateInvalid={formState.password.isValid}/>
					<br/>
					<InvalidDisplay validatorProperties={formState}/>
				</form>
			</>
		);
	});
};

export default Scene;