const path = require('path');
const merge = require('webpack-merge');
const dev = require('./webpack.dev.js');

module.exports = merge(dev, {
	devServer: {
		contentBase: path.join(__dirname, 'build'),
		compress: true,
		port: 9000
	  }
});
