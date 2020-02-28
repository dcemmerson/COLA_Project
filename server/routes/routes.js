var passport=require('passport')
const dbfunc = require('../server_functions/db_functions.js');
const {
	check,
	validationResult
} = require('express-validator');

module.exports = function (app) {
    app.get(`/cola_script_test`, function (req, res) {
	var context = {};
	context.script = ['cola_script_test.js'];
	context.title = 'This is only a test';
	res.render('cola_script_test', context);
    });
        
	app.get(`/login`, function (req, res) {
		res.render('login');
	});
	app.get(`/subscriptions`, function (req, res) {
		res.render('profile')
	});

	app.get(`/create_account`, function (req, res) {
		res.render('create')
	});

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
				dbfunc.add_user(email, pwd, now);
				//console.log(user_id);
				//req.login(user_id, function(err) {
				res.redirect('subscriptions');// })
				return;
				
			}

		})
};

/*
passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});


passport.deserializeUser(function(user_id, done) {
  done(err, user_id);
});
*/