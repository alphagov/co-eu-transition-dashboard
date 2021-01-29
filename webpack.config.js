const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const govUkPath = 'node_modules/govuk-frontend/govuk';
const publicPath = 'common';

module.exports = {
  mode: 'production',
  plugins: [
    new CopyWebpackPlugin([
      { from: path.resolve(govUkPath, 'assets/images'), to: 'images' },
      { from: path.resolve(govUkPath, 'assets/fonts'), to: 'fonts' },
      { from: path.resolve(publicPath, 'images'), to: 'images' },
      { from: path.resolve(publicPath, 'files'), to: 'files' }
    ]),
    new MiniCssExtractPlugin()
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/assets/',
    filename: '[name].js'
  },
  externals: [{ window: 'window' }],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'common'),
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [
              [
                "@babel/preset-env", {
                  useBuiltIns: 'usage',
                  corejs: 3,
                  targets: {
                    browsers: '> 0.5%, IE 11, not dead',
                  },
                }
              ]
            ] }
          }
        ]
      },
      {
        test: /\.scss$/,
        include: path.resolve(__dirname, 'common'),
        exclude: /node_modules/,
        use: [
          'css-hot-loader',
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader' },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ]
      }
    ]
  },
  entry: {
    main: [
      path.resolve(__dirname, 'common/javascript/main.js'),
      path.resolve(__dirname, 'common/scss/main.scss')
    ],
    visualisations: [
      path.resolve(__dirname, 'common/javascript/visualisations/index.js'),
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
