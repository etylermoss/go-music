/* eslint-disable @typescript-eslint/explicit-function-return-type */
const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = (env) => {
	const outputPath = path.resolve(__dirname, env && env.release ? 'build/usr/bin' : 'build');
	return {
		entry: {
			main: './src/index.ts'
		},
		output: {
			filename: 'go-music',
			path: outputPath
		},
		target: 'node',
		node:  false,
		module: {
			rules: [
				{
					test: /\.ts$|\.js$/,
					use: ['ts-loader', 'eslint-loader'],
					exclude: /node_modules/
				},
				{
					test: /\.sql$/,
					use: 'raw-loader'
				}
			]
		},
		externals: [
			'sqlite3'
		],
		resolve: {
			extensions: [ '.ts', '.js' ]
		},
		plugins: [
			new CopyPlugin([
				{
					from: 'better-sqlite3/build/Release/better_sqlite3.node',
					context: 'node_modules'
				},
				{
					from: 'integer/build/Release/integer.node',
					context: 'node_modules'
				}
			]),
			new webpack.BannerPlugin({
				banner: '#!/usr/bin/env node',
				raw: true
			}),
			new WebpackShellPlugin({
				onBuildEnd: [`chmod +x ${path.join(outputPath, 'go-music')}`],
			})
		]
	};
};
