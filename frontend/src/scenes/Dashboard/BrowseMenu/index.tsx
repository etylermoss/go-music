/** @jsx jsx */
/* 3rd party imports */
import React from 'react';
import { jsx, Flex, Heading, Text, NavLink } from 'theme-ui';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { faMusic, faCompactDisc, faPalette, faDrum, faBuilding } from '@fortawesome/free-solid-svg-icons';

/* 1st party imports */
import Styles from '@/scenes/Dashboard/BrowseMenu/styles';

/* 1st party imports - Components */
//import MenuBar from '@/scenes/Dashboard/MenuBar';

interface BrowseItemProps {
	icon: FontAwesomeIconProps['icon'];
	text: string;
	selected?: boolean;
	onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const BrowseItem = ({icon, text, selected, onClick}: BrowseItemProps): JSX.Element => {
	return (
		<Flex onClick={onClick} sx={{cursor: 'pointer', color: selected ? 'text' : 'muted'}}>
			<FontAwesomeIcon icon={icon}/>
			<Text variant="muted" sx={{marginLeft: 2, fontSize: '0.75em', color: selected ? 'text' : undefined}}>{text}</Text>
		</Flex>
	);
};

const Component = (): JSX.Element => {
	return (
		<Flex sx={Styles.root}>
			<Heading as="h3">Browse</Heading>
			<nav sx={{margin: '0.75em 0 1.25em 0', fontSize: 3, '*': {marginBottom: 2}}}>
				<BrowseItem text="Songs" selected icon={faMusic}/>
				<BrowseItem text="Albums" icon={faCompactDisc}/>
				<BrowseItem text="Artists" icon={faPalette}/>
				<BrowseItem text="Genres" icon={faDrum}/>
				<BrowseItem text="Labels" icon={faBuilding}/>
			</nav>
			<Heading as="h3">Playlists</Heading>
			<nav>

			</nav>
		</Flex>
	);
};

export default Component;