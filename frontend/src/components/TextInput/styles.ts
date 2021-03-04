/* 3rd party imports */
import { SxStyleProp } from 'theme-ui';

const root: SxStyleProp = {
	alignItems: 'center',
	padding: 2,
	backgroundColor: 'background',
	borderRadius: 8,
};

const button: SxStyleProp = {
	color: 'text',
	border: 'none',
	background: 'none',
	cursor: 'pointer',
	':focus': {
		outline: 'none',
	},
};

const input: SxStyleProp = {
	color: 'text',
	border: 'none',
	background: 'none',
	':focus': {
		outline: 'none',
	},
};

export default { root, button, input };