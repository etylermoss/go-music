/* 3rd party imports */
import React, { useState, useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

/* 1st part imports - GraphQL */
import allUsersTag from '@/scenes/Admin/gql/AllUsers';
import allSourcesTag from '@/scenes/Admin/gql/AllSources';
import createSourceTag from '@/scenes/Admin/gql/CreateSource';
import allUsersTypes from '@/scenes/Admin/gql/types/AllUsers';
import scanSourceTag from '@/scenes/Admin/gql/ScanSource';
import allSourcesTypes from '@/scenes/Admin/gql/types/AllSources';
import createSourceTypes from '@/scenes/Admin/gql/types/CreateSource';
import scanSourceTypes from '@/scenes/Admin/gql/types/ScanSource';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();
	const { error: users_error, data: users_data } = useQuery<allUsersTypes.AllUsers>(allUsersTag);
	const { error: sources_error, data: sources_data } = useQuery<allSourcesTypes.AllSources>(allSourcesTag);
	const [createSource] = useMutation<createSourceTypes.CreateSource>(createSourceTag);
	const [scanSource] = useMutation<scanSourceTypes.ScanSource>(scanSourceTag);

	if (!store.user?.adminPriority)
		history.push('/dashboard');

	const [source, setSource] = useState({
		name: '',
		path: '',
	});

	const updateSource = (evt: React.ChangeEvent<HTMLInputElement>): void => setSource({
		...source,
		[evt.target.name]: evt.target.value,
	});


	const submitAddSource = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		const result = await createSource({variables: { data: source }});
		if (result?.data?.createSource?.resourceID)
			alert('Successfully added source!');
	};

	const handleScanSource = async (resourceID: string): Promise<void> => {
		const result = await scanSource({variables: { resourceID }});
		if (result?.data?.scanSource)
			alert('Successfully refreshed source!');
	};

	return useObserver(() => (
		<>
			<h1>You are an admin with priority: {store.user?.adminPriority}</h1>
			{users_error || sources_error ? <></> : (
				<>
					<h2>Users</h2>
					<table>
						<thead>
							<tr>
								<th>User ID</th>
								<th>Username</th>
								<th>Email</th>
								<th>Real Name</th>
								<th>Admin Priority</th>
							</tr>
						</thead>
						<tbody>
							{users_data?.users?.map(user => (
								<tr key={user.userID}>
									<td>{user.userID}</td>
									<td>{user.username}</td>
									<td>{user.details?.email}</td>
									<td>{user.details?.realName}</td>
									<td>{user.adminPriority}</td>
								</tr>
							))}
						</tbody>
					</table>
					<h2>Sources</h2>
					<table>
						<thead>
							<tr>
								<th>Source ID</th>
								<th>Name</th>
								<th>Path</th>
								<th>Refresh</th>
							</tr>
						</thead>
						<tbody>
							{sources_data?.sources?.map(source => (
								<tr key={source.resourceID}>
									<td>{source.resourceID}</td>
									<td>{source.name}</td>
									<td>{source.path}</td>
									<td>
										<button onClick={() => handleScanSource(source.resourceID)}>Refresh</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<h3>Add Source</h3>
					<form onSubmit={submitAddSource}>
						<input name="name" type="text" placeholder="Name"
							value={source.name}
							onChange={evt => updateSource(evt)}
						/>
						<input name="path" type="text" placeholder="Path"
							value={source.path}
							onChange={evt => updateSource(evt)}
						/>
						<input type="submit" value="Submit"/>
					</form>
				</>
			)}
		</>
	));
};

export default Scene;