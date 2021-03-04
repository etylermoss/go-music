/* 3rd party imports */
import React from 'react';
import { IconButton } from 'theme-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

interface BrowseMenuButtonProps {
	browseActive: boolean;
	setBrowseActive: (browseActive: boolean) => void;
}

const Component = ({browseActive, setBrowseActive}: BrowseMenuButtonProps): JSX.Element => {
	return (
		<IconButton onClick={() => setBrowseActive(!browseActive)}>
			<FontAwesomeIcon size="lg" icon={faBars}/>
		</IconButton>
	);
};

export default Component;