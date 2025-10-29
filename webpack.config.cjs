const path = require('path');

const baseConfig = {
  entry: './src/index.ts',
  mode: 'production',
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        use: 'ts-loader',
        test: /\.(ts|tsx)$/,
        exclude: [
          /node_modules/, /\.test\.ts$/, /\.mock\.ts$/, /src\/test\//, /dist/
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
    },
  },
};

module.exports = [
  {
    ...baseConfig,
    output : {
      filename : 'obsidize-tar-browserify.js',
      path : path.resolve(__dirname, 'packed'),
      library : {
        name : 'ObsidizeTarBrowserify',
        type : 'global',
      },
    },
  },
  {
    ...baseConfig,
    output : {
      filename : 'index.cjs',
      path : path.resolve(__dirname, 'dist'),
      library : {
        type : 'commonjs2',
      },
    },
  },
];
