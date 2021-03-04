const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
					exclude: /node_modules/,
					use: [
						{ loader: 'ts-loader'},
						{ loader: 'eslint-loader' }
					]
				},
				{
					test: /\.js$/,
					enforce: 'pre',
					use: [
						{ loader: 'source-map-loader' }
					]
				},
				{
					test: /\.html$/,
					use: [
						{ loader: 'html-loader' }
					]
				},
				{
					test: /\.(css|scss|sass)$/i,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						'sass-loader'
					]
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
				filename: 'index.html',
				minify: 'auto'
			}),
			new MiniCssExtractPlugin({
				filename: '[name].css'
			}),
		]
	}
};