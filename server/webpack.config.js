require('core-js'); // require first!!
require('regenerator-runtime/runtime');
//require('@babel/preset-env');

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

/*
module.exports = {
    mode: 'production',
    entry: {
	account: ['./src/js/account.js'],
	createAccount: ['./src/js/createAccount.js'],
	FAQ: ['./src/js/FAQ.js'],
	login: ['./src/js/login.js'],
	recover: ['./src/js/recover.js'],
	requestVerificationCode: ['./src/js/requestVerificationCode.js'],
	reset: ['./src/js/reset.js'],
	subscriptions: ['./src/js/subscriptions.js'],
	userInfo: './src/js/userInfo.js',
	home: './src/js/home.js',
    },
//    devtool: 'inline-source-map',
    plugins: [
	new CleanWebpackPlugin(),
    ],
    output: {
	filename: '[name].min.js',
	path: path.resolve(__dirname, 'public/js'),
	publicPath: '/',
    },
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
*/

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
    },
//    devtool: 'inline-source-map',
    plugins: [
	new CleanWebpackPlugin(),
    ],
    output: {
	filename: '[name].min.js',
	path: path.resolve(__dirname, 'public/js'),
	publicPath: '/',
    },
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