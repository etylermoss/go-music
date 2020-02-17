const common = require('../.eslint.common.js');

module.exports = {
	...common,
	env: {
		node: false,
		browser: true,
		es6: true
	},
	settings: {
		react: {
			createClass: 'createReactClass',
			pragma: 'React',
			version: 'detect'
		}
	},
	extends: [
		'plugin:react/recommended'
	].concat(common.extends)
}
