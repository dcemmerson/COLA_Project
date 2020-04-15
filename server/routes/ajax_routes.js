const db = require('../server_functions/db_functions.js');

const misc = require('../server_functions/misc.js');
const crs = require('../server_functions/cola_rates_script.js');
const fs = require('fs'); //can be removed after 4/3 - testing purposesv

const multer = require('multer');
const upload = multer();

let after_load = require('after-load');

module.exports = function(app,  mysql){
    /* place ajax routes here */
    app.get(`/test`, function(req,res) {
	db.test_method(res, mysql)
	    .then(() => {
		res.render('login');
	    })
	    .catch(err => {
		console.log(err);
		res.end();
	    })
    });

    /********************* MARKED FOR REMOVAL *******************/
    /* name: GET_cola_rates
       preconditions: None
       postconditions: parsed cola rates webpage data sent to calling location
       description: This routes was created simply to develop and test a script
       to GET cola rates webpage, followed by processing the data obtained. This
       route will be removed in near future.
    */
    /*
    app.get(`/GET_cola_rates`, (req, res) => {
	var context = {};
	
	after_load('https://aoprals.state.gov/Web920/cola.asp', html => {
	    const scraped = crs.parse_cola_page(html);
	    db.add_cola_rates(scraped)
		.then(() => res.end())
		.catch(err => {
		    console.log(err);
		    res.end();
		})
	});
    });
*/
    /********************* MARKED FOR REMOVAL *******************/
    /* name: UPDATE_cola_rates
       preconditions: None
       postconditions: parsed cola rates webpage, https://aoprals.state.gov/Web920/cola.asp,
                       and db has been updated with new rates.
       description: This routes was created simply to develop and test a script
       to UPDATE cola rates webpage, followed by processing the data obtained. This
       route will be removed in near future.
    */
/*    app.get(`/UPDATE_cola_rates`, (req, res) => {
	let changed_rates = [];
	after_load('https://aoprals.state.gov/Web920/cola.asp', html => {
	    const scraped = crs.parse_cola_page(html);
	    crs.check_rate_changes(scraped, changed_rates)
		.then(() => {
		    crs.update_changed_rates(changed_rates)
			.then(() => {
			    console.log('COLA rates updated: ' + new Date());
			    res.end();
			})
		})
		.catch(err => {
		    console.log(err)
		    res.end()
		})
	});
    });
*/
    /******************* Subscription page ajax routes *********************/
    app.get('/get_user_subscription_list', /*db.authenticationMiddleware(),*/
	    function (req, res) {
		const temp_user_id = 1;
		let await_promises = [];
		let context = {subscription_list: []};
    		await_promises.push(
		    db.get_user_subscription_list(temp_user_id)
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
    
    app.post('/add_new_subscription_with_template_file', /*db.authenticationMiddleware(),*/ upload.single('upload'),
	     function (req, res) {
		 const temp_user_id = 1;
		 var context = {};
		 
		 misc.validate_file(req.file, context)
		     .then(() => db.insert_new_subscription_with_template_file(temp_user_id,
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
    app.post('/add_new_subscription_with_prev_template', /*db.authenticationMiddleware(),*/
	     function (req, res) {
		 var context = {};
		 const temp_user_id = 1;

		 db.insert_new_subscription_with_prev_template(temp_user_id,
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
    app.get('/preview_template', /*db.authenticationMiddleware(),*/
	    function (req, res) {
		const tempUserId = 1;
		var context = {};

		misc.preview_template(tempUserId, req.query.templateId, context)
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
/*		db.get_user_template(temp_user_id, req.query.templateId)
		    .then(response => {
			if(!response[0]){
			    throw(new Error(`Error: template does not exist`
					    + ` (userId=${temp_user_id},`
					    + ` templateId=${req.query.templateId})`));
			}
			context.filename = response[0].name;
			context.uploaded = response[0].uploaded;
			return tm.docx_to_pdf(response[0].file);
		    })
		    .then(pdfBuf => {
			context.success = true;
			context.file = pdfBuf;
			
		    })
		    .catch(err => {
			if(err) console.log(err);
			context.success = false;
			context.msg = "Error retrieving file";
		    })
		    .finally(() => {
			res.send(context);
		    })
*/
	    });
    app.get('/delete_subscription', /*db.authenticationMiddleware(),*/
	    function (req, res) {
		const temp_user_id = 1;
		var context = {};
		var decrypted;
		
		misc.jwt_verify(req.query.tok)
		    .then(dec => {
			context.country = dec.country;
			context.post = dec.post;
			decrypted = dec;
			return db.update_user_subscription(dec.subscriptionId,
						   temp_user_id,
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
					  + ` for userId=${temp_user_id}`);
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
    app.post('/update_password', function (req, res) {
	const tempUserId = 1;
	var context = {};

	misc.validate_password(tempUserId, req.body.oldPassword,
			       req.body.newPassword, req.body.newPasswordRe, context)
	    .then(() => misc.hash_password(req.body.newPassword))
	    .then(hashedPwd => db.update_user_password(tempUserId, hashedPwd))
	    .then(() => {
		context.passwordUpdated = true;
		context.successMessage = 'Password changed';
		res.send(context);
	    })
	    .catch(err => {
		if(err) console.log(err);

		context.passwordUpdated = false;
		res.send(context);
	    })
    });
    /********************* End Account page ajax routes *********************/
    /********************* Start FAQ page ajax routes *********************/
    app.get('/preview_default_template', /*db.authenticationMiddleware(),*/
	    function (req, res) {
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
	console.log(req.session.passport);
	const temp_user_id = 1;
	var context = {
	    style: ['unsubscribetok.css', 'font_size.css', 'styles.css']
	}

	//if not logged in
	context.layout = 'loginLayout.hbs.hbs';
	//else deliver logged in navbar
	
	var decrypted;
	
	if(!req.query.tok){
	    console.log(`Invalid token: ${req.query.tok}`);
	    context.error = true;
	    context.deleted = false;
	    res.render('unsubscribetok', context);
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
		res.render('unsubscribetok',context);
	    })
	    .catch(err => {
		console.log(err);
		context.error = true;
		res.render('unsubscribetok', context);
	    })
    });
    /**************** End AJAX routes coming from email links ****************/
}

