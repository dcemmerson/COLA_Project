/*  filename: ajax_routes.js
    last modified: 06/23/2020
    description: File contains rendering routes and exports these.
                    Should be imported into main server entry point,
                    server.js.

                    misc.setLayout(req, context) is called before
                    rendering each route to ensure we render correct
                    navbar and other features on page that should
                    only be available to logged in users, or only
                    to users flagged as admin in db.
*/

const db = require('../server_functions/db_functions.js');
const misc = require('../server_functions/misc.js');
const fs = require('fs');

const PAST30DAYS = 30;
const PAST180DAYS = 180;

module.exports = function (app) {
    app.get('/', function (req, res) {
        let context = {
            style: ['styles.css', 'font_size.css', 'home.css'],
            script: ['home.min.js'],
            title: 'COLA Notifications',
            homepage: true
        };

        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('home', context))
    });

    app.get(`/login`, function (req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        let context = {
            layout: 'loginLayout.hbs',
            title: 'Login - COLA',
            login: true,
            style: ['login.css', 'styles.css', 'font_size.css'],
            script: ['login.min.js']
        }

        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('login', context))
    });
    app.get(`/create_account`, function (req, res) {
        let context = {
            title: 'Create Account - COLA',
            createAccount: true,
            style: ['createAccount.css', 'styles.css', 'font_size.css'],
            script: ['createAccount.min.js'],
            layout: 'loginLayout.hbs'
        }
        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('create', context))
    });

    app.get('/verify', function (req, res) {
        var decrypted = {};
        let context = {
            title: 'Account Verification - COLA',
            style: ['styles.css', 'font_size.css'],
            script: ['utility.min.js']
        };

        misc.setLayout(req, context)
            .then(() => misc.jwtVerify(req.query.tok))
            .then(dec => {
                decrypted = dec;
                context.tok = req.query.tok;
                context.verificationSent = decrypted.verificationSent;
                context.loggedInEmail = context.email;
                return db.getUserById(decrypted.userId, context);
            })
            .then(() => {
                context.verifyEmail = context.email;
                context.email = context.loggedInEmail;
                if (context.isVerified) {
                    //this tokens already been used/email has been verified
                    context.isAlreadyVerified = true;
                }
                else if (!context.loggedIn && decrypted.verify) {
                    return db.verifyEmail(decrypted.userId, decrypted.email, context);
                }
                else {
                    return;
                }

            })
            .catch(err => {
                if (err) console.log(err);
                context.invalidToken = true;
                context.success = false;
            })
            .finally(() => {
                console.log(context);
                res.render('verify', context);
            })
    });

    app.get('/requestVerificationCode', function (req, res) {
        let context = {
            title: 'Request New Verification Code - COLA',
            style: ['login.css', 'styles.css', 'font_size.css'],
            script: ['requestVerificationCode.min.js']

        }

        misc.setLayout(req, context)
            .then(() => {
                res.render('requestVerificationCode', context);
            })
    });

    app.get(`/reset`, function (req, res) {
        if (req.isAuthenticated()) {
            res.redirect('account');
            return;
        }

        let context = {
            layout: 'loginLayout.hbs',
            title: 'Reset Password - COLA',
            style: ['reset.css', 'styles.css', 'font_size.css'],
            script: ['reset.min.js'],
            layout: 'loginLayout.hbs'
        }
        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('reset', context))
    });

    app.get('/about', function (req, res) {
        let context = {
            style: ['styles.css', 'font_size.css', 'FAQ.css'],
            script: ['FAQ.min.js'],
            title: 'About - COLA',
            about: true
        };

        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('FAQ', context))
    });

    app.get('/account', db.authenticationMiddleware(), function (req, res) {

        const userId = req.session.passport.user.userId;
        let context = {
            style: ['styles.css', 'font_size.css', 'account.css'],
            script: ['account.min.js'],
            title: 'My Account',
            account: true //used for navivation.hbs
        };

        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('account', context))
    });

    app.get('/subscriptions', db.authenticationMiddleware(), function (req, res) {
        const userId = req.session.passport.user.userId;
        let awaitPromises = [];
        let context = {
            postInfo: [],
            templates: [],
            style: ['styles.css', 'font_size.css', 'subscriptions.css'],
            title: 'My Subscriptions',
            subscriptions: true, //used for navivation.hbs
            script: ['subscriptions.min.js']
        };

        // We need to make db calls to get all available posts, user's template names
        // (not actual template files), and the common setLayout. These all return
        // promises, so we will push these calls to an array and use Promise.all
        // to wait for these to resolve before rendering.
        awaitPromises.push(
            db.getListOfPosts()
                .then(posts => posts.forEach(post => {
                    context.postInfo.push(post);
                }))
                .catch(err => console.log(err))
            ,
            db.getUserTemplateNames(userId)
                .then(templates => templates.forEach(template => {
                    context.templates.push(template);
                }))
                .catch(err => console.log(err))
            ,
            misc.setLayout(req, context)
                .catch(err => console.log(err))
        )

        Promise.all(awaitPromises)
            .catch(err => console.log(err))
            .finally(() => res.render('subscriptions', context))
    });

    app.get(`/logout`, function (req, res) {
        req.logout();
        req.session.destroy();

        if (req.query.redirect) {
            return res.redirect(`/${req.query.redirect}`);
        }
        res.redirect('/login');
    });

    app.get('/reset_password', function (req, res) {
        var context = {
            title: 'Reset Password - COLA',
            style: ['styles.css', 'font_size.css', 'account.css'],
            script: ['recover.min.js']
        };

        db.getUserById(req.query.id, context)
            .then(encPassword => {
                return misc.jwtVerify(
                    req.query.token,
                    (encPassword + context.modified));

            })
            .then(dec => {
                context.token = req.query.token;
                context.validToken = true;
                context.userId = req.query.id;
            })
            .catch(err => {
                if (err) console.log(err);
                context.invalidToken = true;
            })
            .finally(() => misc.setLayout(req, context))
            .catch(() => {
                console.log('error in setLayout - get.reset_password')
                context.layout = 'loginLayout';
                context.error = true;
            })
            .finally(() => {

                res.render('recover', context);
            })
    });

    app.get('/userinfo', db.authenticationMiddleware(), function (req, res) {

        let context = {
            style: ['styles.css', 'font_size.css', 'userInfo.css'],
            script: ['userInfo.min.js'],
            title: 'User Info',
            userInfo: true, //used for navivation.hbs
            userInfo: []
        };

        const userId = req.session.passport.user.userId;

        misc.setLayout(req, context)
            .then(() => {
                if (!context.isAdmin) {
                    throw new Error(`user id:${userId} trying to access /userinfo page`);
                }
                else {
                    return db.getAllUsersSubscriptions(context.userInfo);
                }
            })
            .then(() => {
                context.newUsers = {
                    past30: PAST30DAYS,
                    past180: PAST180DAYS
                };
                return db.getNewUsers(context.newUsers);
            })
            .then(() => {
                context.newSubscriptions = {
                    past30: PAST30DAYS,
                    past180: PAST180DAYS
                };
                return db.getNewSubscriptions(context.newSubscriptions);
            })
            .then(() => {
                console.log(context.newUsers);
                res.render('userInfo', context)
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/')
            })
    });

    // Simple route use by web scrapers to grab the sitemap.
    app.get('/sitemap', function (req, res) {
        let fd = fs.open('./public/siteMap.xml', 'r', (err, fd) => {
            if (err) {
                console.log(err);
                res.end();
            }

            fs.read(fd, (err, bytesRead, sitemap) => {
                if (err) {
                    console.log(err);
                    res.end();
                }
                res.send(sitemap);
            });
        });
    });
};
