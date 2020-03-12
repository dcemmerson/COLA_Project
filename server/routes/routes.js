const db = require('../server_functions/db_functions.js');
var passport = require('passport');
const {
	check,
	validationResult
} = require('express-validator');

module.exports = function (app) {
    app.get(`/login`, function (req, res) {
	let context = {};
	context.layout = 'login_layout.hbs';
	res.render('login', context);
    });
    
    app.get(`/subscriptions`, /*db.authenticationMiddleware(),*/
	    function (req, res) {
		const temp_user_id = 1;
		let await_promises = [];
		let context = {post_info: [], templates: []};
		
		await_promises.push(
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
		context.style = ['styles.css', 'font_size.css'];
		context.title = 'My Subscriptions';
		context.subscriptions = true; //used for navivation.hbs
		context.script = ['subscriptions.js', 'subscriptions_upload.js'];
//		context.nonlocal_script = ['https://appsforoffice.microsoft.com/lib/1/hosted/office.js']
		
		Promise.all(await_promises)
		    .then(() => res.render('subscriptions', context))
	    });

    app.get(`/create_account`, function (req, res) {
	let context = {};
	context.layout = 'login_layout.hbs';
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
};



