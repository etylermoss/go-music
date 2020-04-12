const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env) => {
	return merge(common(env), {
		mode: 'development',
		devtool: 'eval-source-map',
		optimization: {
			minimize: false
		}
	});
};
