require('core-js'); // require first!!
require('regenerator-runtime/runtime');

var path = require('path');
var webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = [
    {
        name: 'es6+',
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
    },
    {
        name: 'es5',
        mode: 'production',
        entry: {
            account: ['whatwg-fetch', './src/js/account.js'],
            createAccount: ['whatwg-fetch', './src/js/createAccount.js'],
            FAQ: ['whatwg-fetch', './src/js/es5/FAQ.js'],
            login: ['whatwg-fetch', './src/js/login.js'],
            recover: ['whatwg-fetch', './src/js/recover.js'],
            requestVerificationCode: ['whatwg-fetch', './src/js/requestVerificationCode.js'],
            reset: ['whatwg-fetch', './src/js/reset.js'],
            subscriptions: ['whatwg-fetch', './src/js/es5/subscriptions.js'],
            userInfo: './src/js/userInfo.js',
            home: './src/js/home.js',
            'pdf.worker': ['whatwg-fetch', 'pdfjs-dist/es5/build/pdf.worker.entry'],
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
    }
];
