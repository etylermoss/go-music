/* 3rd party imports */
import React, { useState } from 'react';

/* 1st party imports */
import SignIn from '@/scenes/Login/scenes/SignIn';
import SignUp from '@/scenes/Login/scenes/SignUp';

type Mode = 'signin' | 'signup';

interface ChangeModeProps {
	mode: Mode;
	onChangeMode: Function;
}

const ChangeMode = (props: ChangeModeProps): JSX.Element => {
	return (
		<button onClick={() => props.onChangeMode()}>
			{props.mode === 'signin' ? 'Create account' : 'Sign in instead'}
		</button>
	);
};

const Scene = (): JSX.Element => {
	const [mode, setMode] = useState<Mode>('signin');

	return (
		<>
			<SignIn active={mode === 'signin'}/>
			<SignUp active={mode === 'signup'}/>
			<ChangeMode mode={mode} onChangeMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}/>
		</>
	);
};

export default Scene;