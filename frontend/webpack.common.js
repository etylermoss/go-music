const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		main: './src/index.tsx'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'build'),
		publicPath: '/'
	},
	target: 'web',
	node:  false,
	module: {
		rules: [
			{
				test: /\.(j|t)s(x?)$/,
				use: ['ts-loader', 'eslint-loader'],
				exclude: /node_modules/
			},
			{
				enforce: 'pre',
				test: /\.js$/,
				loader: 'source-map-loader'
			},
			{
				test: /\.html$/,
				use: {
					loader: 'html-loader'
				}
			}
		]
	},
	resolve: {
		extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
		alias: {
			'globalConfig': path.resolve(__dirname, '../', 'global-config.json')
		}
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: './src/index.html',
			filename: './index.html'
		  })
	]
};