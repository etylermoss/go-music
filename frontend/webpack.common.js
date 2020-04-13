const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
	return {
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
					loader: ['ts-loader', 'eslint-loader'],
					exclude: /node_modules/
				},
				{
					test: /\.js$/,
					loader: 'source-map-loader',
					enforce: 'pre'
				},
				{
					test: /\.html$/,
					loader: 'html-loader'
				}
			]
		},
		resolve: {
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			alias: {
				'@': path.resolve(__dirname, 'src/'),
				'@G': path.resolve(__dirname, '../', 'globals/'),
				'mobx': path.resolve(__dirname, 'node_modules/mobx/lib/mobx.es6.js')
			}
		},
		plugins: [
			new webpack.DefinePlugin({
				DEVSERVER: env && env.devserver ? env.devserver : false
			}),
			new HtmlWebPackPlugin({
				template: './src/index.html',
				filename: './index.html'
			})
		]
	}
};