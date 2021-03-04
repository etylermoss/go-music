/* 3rd party imports */
import React, { useState } from 'react';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

/* 1st party imports - Components */
import TextInput from '@/components/TextInput';

const Component = (): JSX.Element => {
	const [search, setSearch] = useState('');
	
	const submit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
	};

	return (
		<TextInput icon={faSearch} placeholder="Search" value={search} setValue={setSearch} submit={submit}/>
	);
};

export default Component;