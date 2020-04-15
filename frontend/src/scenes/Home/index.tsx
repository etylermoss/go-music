/* 3rd party imports */
import React, { useContext } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { useObserver } from 'mobx-react';

/* 1st party imports */
import { StoreContext } from '@/store';

export interface HelloProps {
	compiler: string;
	framework: string;
}

const gqlHello = gql`
	query {
		hello
	}
`;

const HelloWorld = (): JSX.Element => {
	const { loading, error, data } = useQuery(gqlHello);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error :(</p>;

	return (
		<p>{data.hello}</p>
	);
};

const Scene = ((props: HelloProps): JSX.Element => {
	const store = useContext(StoreContext);

	return useObserver(() => (
		<>
			<h1>Hello beautiful, love from {props.compiler} and {props.framework}!</h1>
			<h2>I have a message for you:</h2>
			<HelloWorld/>
			<p>Value of token: {store.token}</p>
			<input onChange={(el): void => {store.updateToken(el.target.value)}} />
		</>
	));
});

export default Scene;