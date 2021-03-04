/* 3rd party imports */
import { Theme } from 'theme-ui';

/* 1st party imports */
import Fonts from '@/theme/fonts';
import Colors from '@/theme/colors';
import Links from '@/theme/links';
import Text from '@/theme/text';
import Buttons from '@/theme/buttons';

export default {
	...Fonts,
	colors: Colors,
	links: Links,
	text: Text,
	buttons: Buttons,
	space: [0, 0.25, 0.5, 1, 1.5, 3].map(n => n + 'rem'),
	breakpoints: [36, 48, 62, 75].map(n => n + 'rem'),
} as Theme;