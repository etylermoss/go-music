/* 3rd party imports */
import { Theme } from 'theme-ui';
import { lighten } from '@theme-ui/color';

export default {
	icon: {
		display: 'flex',
		padding: 4,
		margin: 2.5,
		borderRadius: 8,
		cursor: 'pointer',
		':hover': {
			color: 'primary',
			backgroundColor: lighten('background', 0.025),
		},
	},
} as Theme['buttons'];