const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
	account: './src/js/account.js',
	account_ajax: './src/js/account_ajax.js',
	createAccount: './src/js/createAccount.js',
	createAccount_ajax: './src/js/createAccount_ajax.js',
	FAQ: './src/js/FAQ.js',
	login: './src/js/login.js',
	login_ajax: './src/js/login_ajax.js',
	recover: './src/js/recover.js',
	recover_ajax: './src/js/recover_ajax.js',
	requestVerificationCode: './src/js/requestVerificationCode.js',
	requestVerificationCode_ajax: './src/js/requestVerificationCode_ajax.js',
	reset: './src/js/reset.js',
	reset_ajax: './src/js/reset_ajax.js',
	subscriptions: './src/js/subscriptions.js',
	subscriptions_ajax: './src/js/subscriptions_ajax.js',	
	userInfo: './src/js/userInfo.js',
	utility: './src/js/utility.js',
//	pdf: './src/js/pdf.js'
    },
//    devtool: 'inline-source-map',
    devServer: {
	contentBase: './dist',
    },
    plugins: [
	new CleanWebpackPlugin(),
	new HtmlWebpackPlugin({
	    title: 'Development',
	}),
    ],
    output: {
	filename: '[name].min.js',
	path: path.resolve(__dirname, 'public/js'),
	publicPath: '/',
    },
    module: {
	rules: [
	    {
		test: /\.css$/,
		use: [
		    'style-loader',
		    'css-loader',
		],
	    },
	],
    },
};
