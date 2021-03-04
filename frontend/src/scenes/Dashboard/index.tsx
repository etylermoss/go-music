/** @jsx jsx */
/* 3rd party imports */
import { jsx, Flex } from 'theme-ui'; 

/* 1st party imports */
import Styles from '@/scenes/Dashboard/styles';

/* 1st party imports - Components */
import MenuBar from '@/scenes/Dashboard/MenuBar';
import BrowseMenu from '@/scenes/Dashboard/BrowseMenu';

const Scene = (): JSX.Element => {
	return (
		<Flex sx={Styles.root}>
			<MenuBar/>
			<Flex sx={Styles.subroot}>
				<BrowseMenu/>
				<p>Main view</p>
			</Flex>
		</Flex>
	);
};

export default Scene;