/* 3st party imports */
import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

export interface HelloProps {
	compiler: string;
	framework: string;
}

const GQL_hello = gql`
	query {
		hello
	}
`;

const HelloWorld = (): JSX.Element => {
	const { loading, error, data } = useQuery(GQL_hello);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error :(</p>;

	return (
		<p>{data.hello}</p>
	);
};

export const Greeting = (props: HelloProps): JSX.Element => {
	return (
		<>
			<h1>Hello beautiful, love from {props.compiler} and {props.framework}!</h1>
			<h2>I have a message for you:</h2>
			<HelloWorld/>
		</>
	);
};