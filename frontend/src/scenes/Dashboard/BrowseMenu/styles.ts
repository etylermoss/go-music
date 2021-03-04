/* 3rd party imports */
import { SxStyleProp } from 'theme-ui';
import { darken } from '@theme-ui/color';

const root: SxStyleProp = {
	flexDirection: 'column',
	alignItems: 'start',
	padding: 4,
	minWidth: '17rem',
	backgroundColor: darken('background', 0.020),
};

export default { root };