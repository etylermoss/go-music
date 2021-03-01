/* 3rd party imports */
import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import { StoreContext, User } from '@/store';

/* 1st party imports - Components*/
import SignIn from '@/scenes/Login/SignIn';
import SignUp from '@/scenes/Login/SignUp';

type SignedInFunc = (user: User) => void;

type Mode = 'signin' | 'signup';

interface ChangeModeProps {
	mode: Mode;
	onChangeMode: Function;
}

const ChangeMode = (props: ChangeModeProps): JSX.Element => {
	return (
		<button onClick={() => props.onChangeMode()}>
			{props.mode === 'signin' ? 'Create account' : 'Sign in'}
		</button>
	);
};

const Scene = (): JSX.Element => {
	const [mode, setMode] = useState<Mode>('signin');
	const store = useContext(StoreContext);
	const history = useHistory();

	const signedIn: SignedInFunc = (user) => {
		store.updateUser(user);
		history.push('/dashboard');
	};

	return (
		<>
			<SignIn signedIn={signedIn} active={mode === 'signin'}/>
			<SignUp signedIn={signedIn} active={mode === 'signup'}/>
			<ChangeMode mode={mode} onChangeMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}/>
		</>
	);
};

export { SignedInFunc };
export default Scene;