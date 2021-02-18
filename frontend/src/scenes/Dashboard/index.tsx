/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import { StoreContext } from '@/store';

const Scene = (): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	return useObserver(() => (
		<>
			<nav>
				<ul>
					<li><button onClick={() => history.push('/dashboard')}>Home</button></li>
					{store.user?.adminPriority && <li><button onClick={() => history.push('/admin')}>Admin</button></li>}
				</ul>
			</nav>
			<h2>Hello <b>{store.user?.username}!</b></h2>
		</>
	));
};

export default Scene;