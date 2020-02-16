const path = require('path');

module.exports = {
	entry: {
		main: './src/index.ts'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'build')
	},
	target: 'node',
	node:  false,
	module: {
		rules: [
			{
				test: /\.ts$|\.js$/,
				use: ['ts-loader', 'eslint-loader'],
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: [ '.ts', '.js' ]
	}
};
