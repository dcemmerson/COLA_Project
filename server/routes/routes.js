const db = require('../server_functions/db_functions.js');
var misc = require('../server_functions/misc.js');

module.exports = function (app) {
    app.get('/', function (req, res) {
        let context = {};
        context.style = ['styles.css', 'font_size.css', 'home.css'];
        context.script = ['utility.js'];

        context.title = 'COLA Notifications';
        context.homepage = true;


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
            script: ['login.js', 'login_ajax.js', 'utility.js']
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
            script: ['createAccount.js', 'createAccount_ajax.js', 'utility.js'],
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
            style: ['styles.css', 'font_size.css']
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
            script: ['requestVerificationCode.js', 'requestVerificationCode_ajax.js', 'utility.js']

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
            script: ['reset.js', 'reset_ajax.js', 'utility.js'],
            layout: 'loginLayout.hbs'
        }
        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('reset', context))
    });

    app.get('/about', function (req, res) {
        let context = {};
        context.style = ['styles.css', 'font_size.css', 'FAQ.css'];
        context.script = ['FAQ.js', 'utility.js'];
        context.deferScript = ['../pdfjs/pdf.js'];
        context.title = 'About - COLA';
        context.about = true;

        misc.setLayout(req, context)
            .catch(() => console.log('error in setLayout'))
            .finally(() => res.render('FAQ', context))
    });

    app.get('/account', db.authenticationMiddleware(), function (req, res) {
        let context = {};
        const userId = req.session.passport.user.userId;
        context.style = ['styles.css', 'font_size.css', 'account.css'];
        context.script = ['account.js', 'account_ajax.js', 'utility.js'];
        context.title = 'My Account';
        context.account = true; //used for navivation.hbs

	misc.setLayout(req, context)
	    .catch(() => console.log('error in setLayout'))
	    .finally(() => res.render('account', context))
    });

    app.get('/subscriptions', db.authenticationMiddleware(), function (req, res) {
        const userId = req.session.passport.user.userId;
        let awaitPromises = [];
        let context = { postInfo: [], templates: [] };
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
	
        context.style = ['styles.css', 'font_size.css', 'subscriptions.css'];
        context.title = 'My Subscriptions';
        context.subscriptions = true; //used for navivation.hbs
        context.script = ['subscriptions.js',
            'subscriptions_ajax.js',
            'utility.js'];
        context.deferScript = ['../pdfjs/pdf.js'];
	
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


    app.post(`/forgot`, function (req, res) {
        res.redirect('/reset');
    });



    app.get('/reset_password', function (req, res) {
        var context = {
            title: 'Reset Password - COLA'
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
                context.style = ['styles.css', 'font_size.css', 'account.css'];
                context.script = ['recover.js', 'recover_ajax.js', 'utility.js'];
                res.render('recover', context);
            })
    });
    
    app.get('/userinfo', db.authenticationMiddleware(), function (req, res) {

        let context = {
            style: ['styles.css', 'font_size.css', 'userInfo.css'],
            script: ['userInfo.js', 'utility.js'],
            title: 'User Info',
            account: true, //used for navivation.hbs
	    userInfo: []
	};

        const userId = req.session.passport.user.userId;

	misc.setLayout(req, context)
	    .then(() => {
		if(!context.isAdmin) {
		    throw new Error(`user id:${userId} trying to access /userinfo page`);
		}
		else {
		    return db.getAllUsersSubscriptions(context.userInfo);
		}
	    })
	    .then(() => res.render('userInfo', context))
	    .catch(err => {
		console.log(err);
		return res.redirect('/')
	    })
    });

};
