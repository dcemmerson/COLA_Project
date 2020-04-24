const db = require('../server_functions/db_functions.js');

const misc = require('../server_functions/misc.js');
const crs = require('../server_functions/cola_rates_script.js');
const emails = require('../server_functions/emails.js');

const multer = require('multer');
const upload = multer();

let after_load = require('after-load');

module.exports = function(app, passport){
    app.post(['/login'], passport.authenticate(
	'local', {
	    successRedirect: '/subscriptions',
	    failureRedirect: '/login'
	}));
    
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
				    await_signing.push(misc.jwt_sign({post:sub.post,
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
    
    app.post('/add_new_subscription_with_template_file', db.authenticationMiddleware(), upload.single('upload'),
	     function (req, res) {
		 const userId = req.session.passport.user.user_id;
		 var context = {};
		 
		 misc.validate_file(req.file, context)
		     .then(() => db.insert_new_subscription_with_template_file(userId,
									       req.body.post_id,
									       req.file.originalname,
									       req.file.buffer))
		     .then(() => {
			 context.success = true;
			 res.send(context);
		     })
		     .catch(err => {
			 if(err) console.log(err);
			 context.success = false;
			 context.error = err;
			 res.send(context);
		     })
	     });
    app.post('/add_new_subscription_with_prev_template', db.authenticationMiddleware(),
	     function (req, res) {
		 var context = {};
		 const userId = req.session.passport.user.user_id;

		 db.insert_new_subscription_with_prev_template(userId,
							       req.body.post_id,
							       req.body.template_id)
		     .then(() => {
			 context.success = true;
			 res.send(context);
		     })
		     .catch(err => {
			 context.success = false;
			 context.error = err;
			 console.log(err);
			 res.send(context);
		     })
	     });
    app.get('/preview_template', db.authenticationMiddleware(),
	    function (req, res) {
		const userId = req.session.passport.user.user_id;
		var context = {};

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
    /********************* End Account page ajax routes *********************/
    /********************* Start FAQ page ajax routes *********************/
    app.get('/preview_default_template', function (req, res) {
	const defaultUserId = process.env.DEFAULT_USER_ID || 1;
	const defaultTemplateId = process.env.DEFAULT_TEMPLATE_ID || 6;
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
		console.log(dec);
		decrypted = dec;
		
		context.country = dec.country;
		context.post = dec.post;
		context.username = dec.username;

		return db.update_user_subscription(dec.subscriptionId, dec.userId, dec.makeActive);
	    })
	    .then(dbres => {
		console.log(dbres);
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
		res.render('resetSent', context);
	    })
	
    });
    /**************** End AJAX routes coming from reset password page ****************/
}

