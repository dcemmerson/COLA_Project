require('core-js'); // require first!!
require('regenerator-runtime/runtime');

var path = require('path');
var webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
	account: ['whatwg-fetch', './src/js/account.js'],
	createAccount: ['whatwg-fetch', './src/js/createAccount.js'],
	FAQ: ['whatwg-fetch', './src/js/FAQ.js'],
	login: ['whatwg-fetch', './src/js/login.js'],
	recover: ['whatwg-fetch', './src/js/recover.js'],
	requestVerificationCode: ['whatwg-fetch', './src/js/requestVerificationCode.js'],
	reset: ['whatwg-fetch', './src/js/reset.js'],
	subscriptions: ['whatwg-fetch', './src/js/subscriptions.js'],
	userInfo: './src/js/userInfo.js',
	home: './src/js/home.js',
	'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry',
    },
//    devtool: 'inline-source-map',
    plugins: [
	new CleanWebpackPlugin(),
    ],
    output: {
	filename: '[name].min.js',
	chunkFilename: '[name].min.js',
	path: path.resolve(__dirname, 'public/js/es5'),
	publicPath: '/js/es5/',
    },
    target: 'web',
    module: {
	rules: [
	    {
		test: /\m?js$/,
		exclude: /(node_modules)/,
		use: {
		    loader: 'babel-loader',
		    options: {
			presets: [
			    ['@babel/preset-env', {
				targets: {
				    browsers: [">0.25%", "ie >= 11"]
				},
				useBuiltIns: 'usage',
				corejs: '3',
			    }]
			],
			cacheDirectory: true,
			
		    }
		}
	    }
	]
    },
};
