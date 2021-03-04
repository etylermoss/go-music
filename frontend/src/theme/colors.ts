/* eslint-disable @typescript-eslint/no-unused-vars */
/* 3rd party imports */
import { Theme } from 'theme-ui';

/* theme: bootstrap (modified) */
const bootstrap: Theme['colors'] = {
	text: '#212529',
	background: '#fff',
	primary: '#007bff',
	secondary: '#6c757d',
	link: '#3881b5',
	muted: '#dee2e6',
	success: '#28a745',
	info: '#17a2b8',
	warning: '#ffc107',
	danger: '#dc3545',
	light: '#f8f9fa',
	dark: '#343a40',
};

/* theme: parmaviolet */
const parmaviolet: Theme['colors'] = {
	text: '#2d3338',
	muted: '#595959',
	background: '#fff',
	primary: '#9696f3',
	secondary: '#4a4c6c',
	link: '#3881b5',
	success: '#28a745',
	info: '#17a2b8',
	warning: '#ffc107',
	danger: '#dc3545',
	light: '#f8f9fa',
	dark: '#343a40',
	modes: {
		dark: {
			text: '#eee',
			muted: '#bbb',
			background: '#222',
			secondary: '#60638C',
			link: '#66A8D7',
		},
	},
};
  
export default parmaviolet;