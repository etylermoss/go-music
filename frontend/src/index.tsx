import React from 'react';
import ReactDOM from 'react-dom';

import { Hello } from './hello';

const container = document.getElementById('container');
if (!container) { throw 'Can\'t find container element.' }
ReactDOM.render(
	<Hello compiler='TypeScript' framework='React'/>,
	container
);