const webpack = require('webpack');
const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');
const NodeExternals = require('webpack-node-externals');

module.exports = (env) => {
	const outputFilename = 'go-music';
	const outputPath = path.resolve(__dirname, 'build');
	return {
		entry: {
			main: './src/index.ts'
		},
		output: {
			filename: outputFilename,
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
					use: 'raw-loader',
					exclude: /node_modules/
				}
			]
		},
		externals: [NodeExternals()],
		resolve: {
			extensions: [ '.ts', '.js' ],
			alias: {
				'@': path.resolve(__dirname, 'src/'),
				'@G': path.resolve(__dirname, 'globals/')
			}
		},
		plugins: [
			new webpack.DefinePlugin({
				RELEASE: env && env.release ? env.release : false
			}),
			new webpack.BannerPlugin({
				banner: '#!/usr/bin/env node',
				raw: true
			}),
			new WebpackShellPlugin({
				onBuildEnd: [`chmod +x ${path.join(outputPath, outputFilename)}`],
			})
		]
	};
};
