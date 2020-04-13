const path = require('path');
const merge = require('webpack-merge');
const dev = require('./webpack.dev.js');
const GlobalConfig = require('../globals/config.json');

module.exports = (env) => {
	return merge(dev(env), {
		devServer: {
			contentBase: path.join(__dirname, 'build'),
			compress: true,
			port: GlobalConfig.port + GlobalConfig.devServerPortOffset,
			historyApiFallback: true
		}
	});
};