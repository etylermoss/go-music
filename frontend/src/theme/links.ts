/* 3rd party imports */
import { Theme } from 'theme-ui';
import { lighten } from '@theme-ui/color';

export default {
	regular: {
		color: 'link',
		textDecoration: 'none',
		cursor: 'pointer',
		':hover': {
			color: lighten('link', 0.1),
		},
	},
	nav: {
		color: 'link',
		textDecoration: 'none',
		cursor: 'pointer',
		':hover': {
			color: lighten('link', 0.1),
		},
	},
} as Theme['links'];