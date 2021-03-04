/* 3rd party imports */
import React, { useContext } from 'react';
import { useObserver } from 'mobx-react';
import { useHistory } from 'react-router-dom';
import { Flex, IconButton, useColorMode } from 'theme-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faUser, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { faMoon as faMoonLine } from '@fortawesome/free-regular-svg-icons';

/* 1st party imports */
import { StoreContext } from '@/store';

const Component = (): JSX.Element => {
	const store = useContext(StoreContext);
	const history = useHistory();

	const [colorMode, setColorMode] = useColorMode<'default' | 'dark'>('default');

	return useObserver(() => (
		<Flex>
			<IconButton onClick={() => setColorMode(colorMode === 'default' ? 'dark' : 'default')}>
				<FontAwesomeIcon icon={colorMode === 'default' ? faMoonLine : faMoon}/>
			</IconButton>
			{store.user?.adminPriority ?
				<IconButton onClick={() => history.push('/admin')}>
					<FontAwesomeIcon icon={faUserShield}/>
				</IconButton>
				: <></>
			}
			<IconButton onClick={() => history.push('/profile')}>
				<FontAwesomeIcon icon={faUser}/>
			</IconButton>
		</Flex>
	));
};

export default Component;