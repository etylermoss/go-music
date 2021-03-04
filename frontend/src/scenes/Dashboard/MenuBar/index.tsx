/** @jsx jsx */
/* 3rd party imports */
import { useState } from 'react';
import { useObserver } from 'mobx-react';
import { jsx, Flex, Heading } from 'theme-ui';
import { useHistory } from 'react-router-dom';

/* 1st party imports */
import Styles from '@/scenes/Dashboard/MenuBar/styles';

/* 1st party imports - Components */
import BrowseMenuButton from '@/scenes/Dashboard/MenuBar/BrowseMenuButton';
import Search from '@/scenes/Dashboard/MenuBar/Search';
import MiscNavigation from '@/scenes/Dashboard/MenuBar/MiscNavigation';

const Component = (): JSX.Element => {
	const history = useHistory();

	const [browseActive, setBrowseActive] = useState(false);

	return useObserver(() => (
		<Flex sx={Styles.root}>
			<BrowseMenuButton browseActive={browseActive} setBrowseActive={setBrowseActive}/>
			<Heading as="h1" sx={Styles.title} onClick={() => history.push('/dashboard')}>
				Go Music
			</Heading>
			<Search/>
			<MiscNavigation/>
		</Flex>
	));
};

export default Component;