const db = require('../server_functions/db_functions.js');
var misc = require('../server_functions/misc.js');

//var passport = require('passport');
const {
    check,
    validationResult
} = require('express-validator');

module.exports = function (app) {
    app.get('/', function (req, res) {
	let context = {};
	context.style = ['styles.css', 'font_size.css', 'home.css'];
	context.script = ['utility.js'];

	context.title = 'COLA Notifications';
	context.homepage = true;
	
	misc.set_layout(req, context)
	    .catch(() => console.log('error in set_layout'))
	    .finally(() => res.render('home', context))
    });
    app.get(`/login`, function (req, res) {
	let context = {
	    layout: 'loginLayout.hbs',
	    title: 'Login - COLA',
	    style: ['login.css', 'styles.css', 'font_size.css'],
	    script: []
	}
	res.render('login', context);
    });
    app.get(`/create_account`, function (req, res) {
	let context = {
	    layout: 'loginLayout.hbs',
	    title: 'Create Account - COLA',
	    style: ['createAccount.css', 'styles.css', 'font_size.css'],
	    script: ['createAccount.js']
	}
	context.layout = 'loginLayout.hbs';
	res.render('create', context);
    });
    app.get('/FAQ', function (req, res) {
	let context = {};
	context.style = ['styles.css', 'font_size.css', 'FAQ.css'];
	context.script = ['FAQ.js', 'utility.js'];
	context.deferScript = ['../pdfjs/pdf.js'];
	context.title = 'FAQ - COLA';
	context.FAQ = true;

	misc.set_layout(req, context)
	    .catch(() => console.log('error in set_layout'))
	    .finally(() => res.render('FAQ', context))
    });
    
    app.get('/account', db.authenticationMiddleware(),  function (req, res) {
	let context = {};
	let awaitPromises = [];
	const user_id = req.session.passport.user.user_id;
	context.style = ['styles.css', 'font_size.css', 'account.css'];
	context.script = ['account.js', 'account_ajax.js', 'utility.js'];
	context.title = 'My Account';
	context.account = true; //used for navivation.hbs
	
	awaitPromises.push(
	    db.get_user_email(user_id)
		.then(res => context.email = res[0].email)
		.catch(err => console.log(err))
	);
	Promise.all(awaitPromises)
	    .then(() => res.render('account', context))
    });
  
    app.get('/subscriptions', db.authenticationMiddleware(), function (req, res) {
	const userId = req.session.passport.user.user_id;
	let awaitPromises = [];
	let context = {post_info: [], templates: []};
	awaitPromises.push(
	    db.get_list_of_posts()
		.then(posts => posts.forEach(post => {
		    context.post_info.push(post);
		}))
		.catch(err => console.log(err))
	    ,
	    db.get_user_template_names(userId)
		.then(templates => templates.forEach(template => {
		    context.templates.push(template);
		}))
		.catch(err => console.log(err))
	    ,
	    db.get_user_email(userId)
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
    
    // upon submitting create account, validates the form information and adds user to DB
    app.post(
	"/create_account", [
	    // Check validity+
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
		db.add_user(email, pwd, now, res, req)
		.then(console.log(res[0].email))
		.catch(err => console.log(err))
		
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
    


    /*
    app.get('/resetpassword', function (req, res) {
    
    app.get('/resetpassword//:userId//:token', function (req, res) {
	const id=req.params.userId;
	const token=req.params.token;
	db.get_user(req, res, id, token);
	
	}),
    */
    app.get('/reset_password', function(req, res){
	var context = {};
	db.get_user_by_id(req.query.id, context)
	    .then(encPassword => {
		return misc.jwt_verify(
		    req.query.token,
		    (encPassword + context.modified));

	    })
	    .then(dec => {
		context.token = req.query.token;
		context.validToken = true;
		context.userId = req.query.id;
	    })
	    .catch(err => {
		console.log('err route');
		context.invalidToken = true;
		console.log(err);
	    })
	    .finally(() => misc.set_layout(req, context))
	    .catch(() => {
		console.log('error in set_layout - get.reset_password')
		context.layout = 'loginLayout';
		context.error = true;
	    })
	    .finally(() => {
		context.style = ['styles.css', 'font_size.css', 'account.css'];
		context.script = ['recover.js', 'recover_ajax.js', 'utility.js'];
		res.render('recover', context);
	    })
    });
    /*
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
	    
	    })    */
};
