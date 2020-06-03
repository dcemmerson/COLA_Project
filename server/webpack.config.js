require('core-js'); // require first!!
require('regenerator-runtime/runtime');

var path = require('path');
var webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
	account: ['./src/js/account.js'],
	createAccount: ['./src/js/createAccount.js'],
	FAQ: ['./src/js/es6+/FAQ.js'],
	login: ['./src/js/login.js'],
	recover: ['./src/js/recover.js'],
	requestVerificationCode: ['./src/js/requestVerificationCode.js'],
	reset: ['./src/js/reset.js'],
	subscriptions: ['./src/js/es6+/subscriptions.js'],
	userInfo: './src/js/userInfo.js',
	home: './src/js/home.js',
	'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry',
    },
//    devtool: 'inline-source-map', // uncomment to build sourcemaps as well
    plugins: [
//	new CleanWebpackPlugin(), // uncomment to clear dir contents when build
    ],
    output: {
	filename: '[name].min.js',
	chunkFilename: '[name].min.js',
	path: path.resolve(__dirname, 'public/js'),
	publicPath: '/js/',
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
				    browsers: ["chrome 61", "firefox 58", "safari 11"]
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
