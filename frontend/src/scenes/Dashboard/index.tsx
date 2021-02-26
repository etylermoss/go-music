/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useQuery } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import { StoreContext } from '@/store';
import GlobalConfig from '@G/config.json';

/* 1st part imports - GraphQL */
import allSongsTag from '@/scenes/Dashboard/gql/AllSongs';
import allSongsTypes from '@/scenes/Dashboard/gql/types/AllSongs';

const Scene = (props: { url: string }): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const { error: songs_error, data: songs_data } = useQuery<allSongsTypes.AllSongs>(allSongsTag);

	return useObserver(() => (
		<>
			<nav>
				<ul>
					<li><button onClick={() => history.push('/dashboard')}>Home</button></li>
					{store.user?.adminPriority && <li><button onClick={() => history.push('/admin')}>Admin</button></li>}
				</ul>
			</nav>
			<h1>Hello <b>{store.user?.username}!</b></h1>
			{songs_error ? <></> : (
				<>
					<h2>All Songs</h2>
					<table>
						<thead>
							<tr>
								<th>Song ID</th>
								<th>Song Source ID</th>
								<th>Path</th>
								<th>Play</th>
							</tr>
						</thead>
						<tbody>
							{songs_data?.songs?.map(song => (
								<tr key={song.mediaResourceID}>
									<td>{song.mediaResourceID}</td>
									<td>{song.media.sourceResourceID}</td>
									<td>{song.media.path}</td>
									<td>
										<audio controls src={props.url + '/' + GlobalConfig.mediaPath + '/' + song.mediaResourceID}/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</>
	));
};

export default Scene;