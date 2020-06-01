require('core-js'); // require first!!
require('regenerator-runtime/runtime');
require('@babel/preset-env');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
	account: ['core-js', './src/js/account.js'],
	createAccount: ['core-js', './src/js/createAccount.js'],
	FAQ: ['core-js', './src/js/FAQ.js'],
	login: ['core-js', './src/js/login.js'],
	recover: ['core-js', './src/js/recover.js'],
	requestVerificationCode: ['core-js', './src/js/requestVerificationCode.js'],
	reset: ['core-js', './src/js/reset.js'],
	subscriptions: ['core-js', './src/js/subscriptions.js'],
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
/*			    ['@babel/preset-env', {
				useBuiltIns: 'usage',
				corejs: '3',
			    }]
			],
*/
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
