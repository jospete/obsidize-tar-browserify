const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: 'production',
	target: 'node',
	externals: ['tslib'],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'es5.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'commonjs-module'
		}
	}
};