
const db = require('../server_functions/db_functions.js');
//const em=require('../server_functions/emails.js');
var jwt = require('jwt-simple');


var passport = require('passport');
const {
    check,
    validationResult
} = require('express-validator');

module.exports = function (app) {
    app.get(`/login`, function (req, res) {
	let context = {};
	context.layout = 'loginLayout.hbs';
	res.render('login', context);
    });
    app.get('/', function (req, res) {
	let context = {};
	context.style = ['styles.css', 'font_size.css', 'home.css'];
	context.script = ['utility.js'];

	context.layout = 'landingLayout.hbs';
	context.title = 'COLA Notifications';
	context.homepage = true;
	res.render('home', context);
    });
    app.get('/FAQ', function (req, res) {
	let context = {};
	context.style = ['styles.css', 'font_size.css', 'FAQ.css'];
	context.script = ['FAQ.js', 'utility.js'];
	context.deferScript = ['../pdfjs/pdf.js'];
	
	context.title = 'FAQ - COLA';
	context.FAQ = true;
	res.render('FAQ', context);
    });
    
    app.get('/account', /* db.authenticationMiddleware(), */ function (req, res) {
	let context = {};
	let awaitPromises = [];
	const temp_user_id = 1;
	context.style = ['styles.css', 'font_size.css', 'account.css'];
	context.script = ['account.js', 'account_ajax.js', 'utility.js'];
	context.title = 'My Account';
	context.account = true; //used for navivation.hbs
	
	awaitPromises.push(
	    db.get_user_email(temp_user_id)
		.then(res => context.email = res[0].email)
		.catch(err => console.log(err))
	);
	Promise.all(awaitPromises)
	    .then(() => res.render('account', context))
    });
    
    app.get('/subscriptions', /*db.authenticationMiddleware(),*/ function (req, res) {
	const temp_user_id = 1;
	let awaitPromises = [];
	let context = {post_info: [], templates: []};
	
	awaitPromises.push(
	    db.get_list_of_posts()
		.then(posts => posts.forEach(post => {
		    context.post_info.push(post);
		}))
		.catch(err => console.log(err))
	    ,
	    db.get_user_template_names(temp_user_id)
		.then(templates => templates.forEach(template => {
		    context.templates.push(template);
		}))
		.catch(err => console.log(err))
	    ,
	    db.get_user_email(temp_user_id)
		.then(res => context.email = res[0].email)
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
	    .then(() => res.render('subscriptions', context))
    });

    app.get(`/create_account`, function (req, res) {
	let context = {};
	context.layout = 'loginLayout.hbs';
	res.render('create', context);
    });
    
    app.post(['/login'], passport.authenticate(
	'local', {
	    successRedirect: '/subscriptions',
	    failureRedirect: '/login'
	}));

    // upon submitting create account, validates the form information and adds user to DB
    app.post(
	"/create_account", [
	    // Check validity
	    check("email", "Email is invalid")
		.isEmail()
		.isLength({
		    min: 4
		}),
	    check("pwd", "Password is invalid: must be at least 8 characters and must contain 1 lowercase, 1 uppercase, 1 number and 1 special character")
		.isLength({
		    min: 8
		})
		.matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')
		.custom((value, {
		    req,
		    loc,
		    path
		}) => {
		    if (value !== req.body.pwdmatch) {
			throw new Error("Passwords don't match");
		    } else {
			return value;
		    }
		})
	],
	(req, res, next) => {
	    // return formatted validation results
	    const errorFormatter = ({
		msg,
	    }) => {
		return `${msg}`;
	    };
	    const errors = validationResult(req).formatWith(errorFormatter);

	    if (!errors.isEmpty()) {
		var errorResponse = errors.array({
		    onlyFirstError: true
		});
		res.render('create', {
		    error: errorResponse
		});

		return;
	    }

	    //if no errors, add user to DB
	    else {
		var email = req.body.email;
		var pwd = req.body.pwd;
		var now = new Date().toISOString().replace(/\..+/, '');
		console.log("userid");
		db.add_user(email, pwd, now, res, req);
		
		//console.log(user_id);
		
		//return;
		
	    }

	})
    
    app.get(`/logout`, function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/login');
    });
    
    app.get(`/reset`, function (req, res) {
	let context = {};
	context.layout = 'loginLayout.hbs';
	res.render('reset', context);
    });

    
    
    app.post(`/forgot`, function (req, res) {
	res.redirect('/reset');
    });
    

    app.post(
	`/reset`, [
	    // Check validity
	    check("email", "Email is invalid")
		.isEmail()
		.isLength({
		    min: 4
		})
	],
	(req, res, next) => {
	    // return formatted validation results
	    const errorFormatter = ({
		msg,
	    }) => {
		return `${msg}`;
	    };
	    const errors = validationResult(req).formatWith(errorFormatter);

	    if (!errors.isEmpty()) {
		var errorResponse = errors.array({
		    onlyFirstError: true
		});
		res.render('reset', {
		    error: errorResponse
		});

		return;
	    }

	    else {
		var email = req.body.email;
		console.log(email);
		db.check_email(email, res, req);	
		var message=db.check_email(email,res, req);

		/////////////////////////////////////////////////
		// i think this if statement needs to be .then chained,
		// otherwise it's never going to return true
		if (message.length==0) 
		{

		    res.render('reset', {
			error: "Email does not exist"
		    });
		}
		else res.redirect('/login');
		

		
	    }

	});
    
    app.get('/resetpassword//:userId//:token', function (req, res) {
	const id=req.params.userId;
	const token=req.params.token;
	db.get_user(req, res, id, token);
	
    }),
    
    app.post(
	'/resetpassword', [
	    // Check validity
	    check("pwd", "Password is invalid: must be at least 8 characters and must contain 1 lowercase, 1 uppercase, 1 number and 1 special character")
		.isLength({
		    min: 8
		})
		.matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')
		.custom((value, {
		    req,
		    loc,
		    path
		}) => {
		    if (value !== req.body.pwdmatch) {
			throw new Error("Passwords don't match");
		    } else {
			return value;
		    }
		})
	],
	(req, res, next) => {
	    // return formatted validation results
	    const errorFormatter = ({
		msg,
	    }) => {
		return `${msg}`;
	    };
	    const errors = validationResult(req).formatWith(errorFormatter);
	    if (!errors.isEmpty()) {
		var errorResponse = errors.array({
		    onlyFirstError: true
		});
		res.render('recover', {
		    error: errorResponse
		});

		return;
	    }

	    else {
		const pwd = req.body.pwd;
		const id=req.body.Id;
		db.update_user(id, pwd);
		res.redirect('/login');	
	    }

	})    
};
