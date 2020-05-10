const db = require('../server_functions/db_functions.js');
const tm = require('../server_functions/template_manip.js');
const misc = require('../server_functions/misc.js');
const crs = require('../server_functions/cola_rates_script.js');
const emails = require('../server_functions/emails.js');

const multer = require('multer');
const upload = multer();

let after_load = require('after-load');

const {
    check,
    validationResult
} = require('express-validator');


module.exports = function(app, passport){
    app.post(['/login'], function(req, res, next){
	var context ={};
	misc.login_helper(passport, req, res, next, context)
	    .catch(err => {
		if(err) console.log(err);
	    })
	    .finally(() => {
		res.send(context);
	    })

    });
    
    /******************* Subscription page ajax routes *********************/
    app.get('/get_user_subscription_list', db.authenticationMiddleware(),
	    function (req, res) {
		const userId = req.session.passport.user.user_id;
		let await_promises = [];
		let context = {subscription_list: []};
    		await_promises.push(
		    db.get_user_subscription_list(userId)
			.then(subs => {
			    //this is ugly but necessary to send to client at right time
			    return new Promise((resolve, reject) => {
				let await_signing = [];
				subs.forEach(sub => {
				    await_signing.push(misc.jwt_sign({
					templateId: sub.templateId,
					post:sub.post,
					country:sub.country,
					subscriptionId:sub.subscriptionId
				    })
						       .then(tok => {
							   sub.tok = tok;
							   context.subscription_list.push(sub);
						       }))
				})
				Promise.all(await_signing).then(resolve);
			    })  
			})
			.catch(err => console.log(err))
		);
		Promise.all(await_promises)
		    .then(() => {
			res.send(context);
		    })
	    });
    app.get('/get_user_template_list', db.authenticationMiddleware(),
	    function (req, res) {
		const userId = req.session.passport.user.user_id;
		let context = {};

		db.get_user_template_names(userId)
		    .then(results => {
			context.templates = results;
		    })
		    .catch(err => {
			if(err) console.log(err);
		    })
		    .finally(() => {
			res.send(context);
		    })
	    });
    
    app.post('/add_new_subscription_with_template_file', db.authenticationMiddleware(), upload.single('upload'),
	     function (req, res) {
		 const userId = req.session.passport.user.user_id;
		 var context = {};
		 
		 misc.validate_file(req.file, context)
		     .then(() => db.insert_new_subscription_with_template_file(userId,
									       req.body.post_id,
									       req.file.originalname,
									       req.file.buffer, '',
									       context))
		     .then(() => db.get_user_subscription_by_id(context.subscriptionId))
		     .then(sub => {
			 console.log(sub);
			 context = sub;
			 return misc.jwt_sign({
			     templateId: sub.templateId,
			     post:sub.post,
			     country:sub.country,
			     subscriptionId:sub.subscriptionId
			 })
			     .then(tok => {
				 context.tok = tok;
			     })
		     })		 
		     .then(() => {
			 context.success = true;
		     })
		     .catch(err => {
			 if(err) console.log(err);
			 context.success = false;
			 context.error = err;
		     })
		     .finally(() => {
			 res.send(context);
		     })
	     });
    app.post('/add_new_subscription_with_prev_template', db.authenticationMiddleware(),
	     function (req, res) {
		 var context = {};
		 const userId = req.session.passport.user.user_id;

		 db.insert_new_subscription_with_prev_template(userId,
							       req.body.post_id,
							       req.body.template_id, '',
							       context)
		     .then(() => db.get_user_subscription_by_id(context.subscriptionId))
		     .then(sub => {
			 console.log(sub);
			 context = sub;
			 return misc.jwt_sign({
			     templateId: sub.templateId,
			     post:sub.post,
			     country:sub.country,
			     subscriptionId:sub.subscriptionId
			 })
			     .then(tok => {
				 context.tok = tok;
			     })
		     })		 
		     .then(() => {
			 context.success = true;
		     })
		     .catch(err => {
			 if(err) console.log(err);
			 context.success = false;
			 context.error = err;
		     })
		     .finally(() => {
			 res.send(context);
		     })
	     });
    app.get('/preview_template', db.authenticationMiddleware(),
	    function (req, res) {
		var userId = req.session.passport.user.user_id;
		var context = {};

		//if user is trying to preview default template, change user
		//id to match the default template user id for sql query
		if(req.query.templateId == process.env.DEFAULT_TEMPLATE_ID){
		    userId = process.env.DEFAULT_TEMPLATE_USER_ID; 
		}

		misc.preview_template(userId, req.query.templateId, context)
		    .then(() => {
			context.success = true;
		    })
		    .catch(err => {
			if(err) console.log(err);
			
			context.msg = "Error retrieving file";
			context.success = false;
		    })
		    .finally(() => {
			res.send(context);
		    })
	    });
    
    app.get('/download_template', db.authenticationMiddleware(),
	    function (req, res) {
		var userId = req.session.passport.user.user_id;
		var context = {};

		//if user is trying to preview default template, change user
		//id to match the default template user id for sql query
		if(req.query.templateId == process.env.DEFAULT_TEMPLATE_ID){
		    userId = process.env.DEFAULT_TEMPLATE_USER_ID; 
		}

		db.get_user_template(userId, req.query.templateId)
		    .then(response => {
			context.filename = response[0].name;
			context.uploaded = response[0].uploaded;
			context.file = response[0].file;
			context.success = true;
		    })
		    .catch(err => {
			if(err) console.log(err);
			context.msg = "Error retrieving file";
			context.success = false;
		    })
		    .finally(() => {
			res.send(context);
		    })
	    });
    
    

    /***************************************************/
    /* functionallity for current subscription buttons */
    /***************************************************/
    // download button
        app.get('/download_subscription', db.authenticationMiddleware(),
		function (req, res) {
		    var userId = req.session.passport.user.user_id;
		    var context = {};
		    var decrypted;
		    //if user is trying to preview default template, change user
		    //id to match the default template user id for sql query
		    if(req.query.templateId == process.env.DEFAULT_TEMPLATE_ID){
			userId = process.env.DEFAULT_TEMPLATE_USER_ID; 
		    }
		    
		    misc.jwt_verify(req.query.tok)
			.then(dec => {
			    decrypted = dec;
			    return db.get_user_template(userId, decrypted.templateId);
			})
			.then(response => {
			    context.filename = response[0].name;
			    context.uploaded = response[0].uploaded;
			    context.file = response[0].file;
			    context.success = true;
			    return db.get_cola_rate(decrypted.country, decrypted.post);
			})
			.then(postInfo => {
			    context.file = tm.manip_template(context, postInfo[0]);
			    context.success = true;
			})
			.catch(err => {
			    if(err) console.log(err);
			    context.msg = "Error retrieving file";
			    context.success = false;
			})
			.finally(() => {
			    res.send(context);
			})
		});
        // fire email button
        app.get('/fire_subscription_email', db.authenticationMiddleware(),
		function (req, res) {
		    var userId = req.session.passport.user.user_id;
		    var context = {};
		    var user = {};
		    var decrypted;
		    
		    misc.jwt_verify(req.query.tok)
		    	.then(dec => {
			    decrypted = dec;
			    return db.get_user_by_id(userId, user);
			})
			.then(() => {
			    //if user is using default template, change user
			    //id to match the default template user id for sql query
			    if(req.query.templateId == process.env.DEFAULT_TEMPLATE_ID){
				userId = process.env.DEFAULT_TEMPLATE_USER_ID; 
			    }

			    return db.get_user_template(userId, decrypted.templateId);
			})
			.then(response => {
			    user.filename = response[0].name;
			    context.filename = response[0].name;
			    context.uploaded = response[0].uploaded;
			    context.file = response[0].file;
			    return db.get_cola_rate(decrypted.country, decrypted.post);
			})
			.then(postInfo => {
			    context.username = user.email;
			    context.file = tm.manip_template(context, postInfo[0]);

			    return emails.send_email(user, postInfo[0], context.file);
			})
			.then(() => {
			    context.success = true;
			})
			.catch(err => {
			    if(err) console.log(err);
			    context.msg = "Error retrieving file";
			    context.success = false;
			})
			.finally(() => {
			    context.file = null;
			    res.send(context);
			})
		});
    // preview button
		app.get('/preview_subscription', db.authenticationMiddleware(),
			function (req, res) {
			    const userId = req.session.passport.user.user_id;
			    var context = {};
			    //		var decrypted;
		
		misc.jwt_verify(req.query.tok)
		    .then(dec => {
//			decrypted = dec;
			return misc.preview_template(userId, dec.templateId, context, dec);
		    })
		    .then(() => {
			context.success = true;
		    })
		    .catch(err => {
			console.log(err);
			context.error = true;
			context.success = true;
			context.msg = "Error retrieving file";
		    })
		    .finally(() => {
			res.send(context);
		    })
	    });
    app.get('/delete_subscription', db.authenticationMiddleware(),
	    function (req, res) {
		const userId = req.session.passport.user.user_id;
		var context = {};
		var decrypted;
		
		misc.jwt_verify(req.query.tok)
		    .then(dec => {
			context.country = dec.country;
			context.post = dec.post;
			decrypted = dec;
			return db.update_user_subscription(dec.subscriptionId,
						   userId,
							   !!dec.makeActive);
		    })
		    .then(res => {
			if(res.changedRows > 0){
			    decrypted.makeActive = !decrypted.makeActive;
			    context.deleted = decrypted.makeActive;
			    context.restored = !decrypted.makeActive;
			}
			else{
			    throw new Error(`Unable to update subscriptionId`
					  + `=${decrypted.subscriptionId} to`
					  + ` active=${!!decrypted.makeActive}`
					  + ` for userId=${userId}`);
			}
			
			return misc.jwt_sign(decrypted);
		    })
		    .then(tok => {
			context.tok = tok;
			res.send(context);
		    })
		    .catch(err => {
			console.log(err);
			context.error = true;
			res.send(context);
		    })
	    });
    /****************** End subscription page ajax routes *******************/
    /*********************** Account page ajax routes ***********************/
    app.post('/update_password', db.authenticationMiddleware(), function (req, res) {
	const userId = req.session.passport.user.user_id;
	var context = {};

	misc.validate_password(userId, req.body.oldPassword,
			       req.body.newPassword, req.body.newPasswordRe, context)
	    .then(() => misc.hash_password(req.body.newPassword))
	    .then(hashedPwd => db.update_user_password(userId, hashedPwd))
	    .then(() => {
		context.passwordUpdated = true;
		context.successMessage = 'Password changed';
	    })
	    .catch(err => {
		if(err) console.log(err);
		context.passwordUpdated = false;
	    })
	    .finally(() => res.send(context))
    });
	

    app.post('/reset_password', function (req, res) {

	var context = {};
	var encryptedPassword;
	db.get_user_by_id(req.body.userId, context)
	    .then(encPassword => {
		encryptedPassword = encPassword;
		return misc.jwt_verify(
		    req.body.token,
		    (encPassword + context.modified));
	    })
	    .then(dec => {
		return misc.validate_password_reset(context.userId, encryptedPassword,
						    req.body.newPassword, req.body.newPasswordRe,
						    context);
	    })
	    .then(() => misc.hash_password(req.body.newPassword))
	    .then(hashedPwd => db.update_user_password(context.userId, hashedPwd))
	    .then(() => {
		context.passwordUpdated = true;
		context.successMessage = 'Password changed';
	    })
	    .catch(err => {
		if(err) console.log(err);
		context.passwordUpdated = false;
	    })
	    .finally(() => res.send(context))

    });
	
    app.post(`/create_account`, function (req, res, next){
        var context = {};
	var email = req.body.email;
	var pwd = req.body.password;
	var pwdRe = req.body.passwordRe;

	misc.validate_email(email, context)
	    .then(() => db.check_if_user_exists(email, context))
	    .then(() => misc.validate_password_new_account(pwd, pwdRe, context))
	    .then(() => misc.hash_password(pwd))
	    .then(hashedPwd => db.add_user(email, hashedPwd, context))
	    .then(() => {
                context.accountCreated = true;
		context.success = true;
		context.redirect = '/subscriptions';
		req.body.username = req.body.email;

		//now log user in
		return misc.login_helper(passport, req, res, next, context)
            })
            .catch(err => {
		console.log('error route');
		if (err) console.log(err);
		context.accountCreated = false;
		context.error = true;
            })
	    .finally(() => res.send(context))
	    
    })
 
	
    /********************* End Account page ajax routes *********************/
    /********************* Start FAQ page ajax routes *********************/
    app.get('/preview_default_template', function (req, res) {
	const defaultUserId = process.env.DEFAULT_TEMPLATE_USER_ID;
	const defaultTemplateId = process.env.DEFAULT_TEMPLATE_ID;
	var context = {};
	misc.preview_template(defaultUserId, defaultTemplateId, context)
	    .then(() => {
		context.success = true;
	    })
	    .catch(err => {
		if(err) console.log(err);
		
		context.msg = "Error retrieving file";
		context.success = false;
	    })
	    .finally(() => {
		res.send(context);
	    })
    });
    /************************* End FAQ page ajax ****************************/
    /************************************************************************
    AJAX routes coming from email links and/or
       coming from one-click unsubscribe/undo unsubscribe
    *************************************************************************/
    app.get('/unsubscribetok', function (req, res) {
	var context = {
	    style: ['unsubscribetok.css', 'font_size.css', 'styles.css'],
	    title: 'Unsubscribe - COLA'
	}
	
	var decrypted;
	
	if(!req.query.tok){
	    console.log(`Invalid token: ${req.query.tok}`);
	    context.error = true;
	    context.deleted = false;
	    misc.set_layout(req, context)
		.catch(() => console.log('error in set_layout'))
		.finally(() => res.render('unsubscribetok', context))
	    return;
	}
	
	misc.jwt_verify(req.query.tok)
	    .then(dec => {
		decrypted = dec;
		
		context.country = dec.country;
		context.post = dec.post;
		context.username = dec.username;

		return db.update_user_subscription(dec.subscriptionId, dec.userId, dec.makeActive);
	    })
	    .then(dbres => {
		context.unsubscribed = !decrypted.makeActive;
		context.resubscribed = decrypted.makeActive;
		if(dbres.changedRows == 0)
		    context.alreadyUpdated = true;
		else if(dbres.changedRows > 0)
		    context.updated = true;
		
		return misc.jwt_sign({username: decrypted.username,
				      subscriptionId: decrypted.subscriptionId,
				      userId: decrypted.userId,
				      post: decrypted.post,
				      country: decrypted.country,
				      postId: decrypted.postId,
				      makeActive: !decrypted.makeActive
				     });
	    })
	    .then(tok => {
		context.doTok = tok;
		return db.get_number_user_redundant_subscriptions(decrypted.userId,
								  decrypted.postId,
								  decrypted.post,
								  decrypted.country);
	    })
	    .then(dbres => {
		if(dbres.numberSubscriptions > 0){
		    context.additionalSubs = true;
		    context.numberAdditionalSubs = dbres.numberSubscriptions;
		}
		return misc.set_layout(req, context);
	    })
	    .then(() => {
		res.render('unsubscribetok',context);
	    })
	    .catch(err => {
		console.log(err);
		context.error = true;
		res.render('unsubscribetok', context);
	    })
    })
    /**************** End AJAX routes coming from email links ****************/
    /***************** AJAX routes coming from password reset page *************/
    
    app.post(`/reset`, (req, res, next) => {
	var context = {};
	context.title = "Reset password - COLA";
	context.style = ['styles.css', 'font_size.css'];
	context.email = req.body.email;
	db.check_email(req.body.email, context)
	    .then(encPassword => {
		return misc.jwt_sign({
		    userId: context.userId,
		    email: context.email
		}, (encPassword + context.modified), "1h")
	    })
	    .then(token => emails.password_reset_email(context.userId, context.email, token))
	    .then(() => {
		console.log('success');
		context.success = true;
	    })
	    .catch(err => {
		if(err){
		    console.log(err);
		    context.msg = "An error occured";
		    context.error = true;
		}
	    })
	    .finally(() => {
		return misc.set_layout(req, context);
	    })
	    .finally(() => {
		res.send(context);
	    })
	
    });
    /**************** End AJAX routes coming from reset password page ****************/
}

