/* eslint-disable @typescript-eslint/explicit-function-return-type */
const webpack = require('webpack');
const path = require('path');
//const CopyPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const NodeExternals = require('webpack-node-externals');

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
		externals: [NodeExternals()],
		resolve: {
			extensions: [ '.ts', '.js' ]
		},
		plugins: [
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
