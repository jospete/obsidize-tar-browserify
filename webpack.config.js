const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: 'production',
	target: 'node',
	externals: ['tslib'],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: 'ts-loader',
				exclude: [/node_modules/, /\.test\.ts$/, /\.mock\.ts$/],
			},
		],
	},
	resolve: {
		extensions: ['.ts'],
	},
	output: {
		filename: 'es5.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'commonjs-module'
		}
	}
};
