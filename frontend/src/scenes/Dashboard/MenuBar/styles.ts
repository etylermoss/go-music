/* 3rd party imports */
import { SxStyleProp } from 'theme-ui';
import { darken } from '@theme-ui/color';

const root: SxStyleProp = {
	alignItems: 'center',
	padding: 2,
	backgroundColor: darken('background', 0.04),
	/* position last child at end of menu */
	'> :last-child': {
		marginLeft: 'auto',
	},
};

const title: SxStyleProp = {
	cursor: 'pointer',
	marginLeft: '0.25em',
	marginRight: '0.8em',
};

export default { root, title };