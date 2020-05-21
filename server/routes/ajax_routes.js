const db = require('../server_functions/db_functions.js');
const tm = require('../server_functions/template_manip.js');
const misc = require('../server_functions/misc.js');
const emails = require('../server_functions/emails.js');

const multer = require('multer');
const upload = multer();


module.exports = function (app, passport) {
    app.post(['/login'], function (req, res, next) {
        var context = {};
        misc.loginHelper(passport, req, res, next, context)
            .catch(err => {
                if (err) console.log(err);
            })
            .finally(() => {
                res.send(context);
            })

    });

    /******************* Subscription page ajax routes *********************/
    app.get('/get_user_subscription_list', db.authenticationMiddleware(),
            function (req, res) {
		const userId = req.session.passport.user.userId;
		let awaitPromises = [];
		let context = {subscriptionList: [] };
		awaitPromises.push(
                    db.getUserSubscriptionList(userId)
			.then(subs => {
                            //this is ugly but necessary to send to client at right times
                            return new Promise((resolve, reject) => {
				let awaitSigning = [];
				subs.forEach(sub => {
                                    awaitSigning.push(misc.jwtSign({
					templateId: sub.templateId,
					post: sub.post,
					country: sub.country,
					subscriptionId: sub.subscriptionId
                                    })
						      .then(tok => {
							  sub.tok = tok;
							  sub.effectiveDate = misc.toHumanDate(sub.effectiveDate);
							  context.subscriptionList.push(sub);
						      }))
				})
				Promise.all(awaitSigning).then(resolve);
                            })
			})
			.catch(err => console.log(err))
		);
		Promise.all(awaitPromises)
                    .then(() => {
			res.send(context);
                    })
            });
    app.get('/get_user_template_list', db.authenticationMiddleware(),
            function (req, res) {
            const userId = req.session.passport.user.userId;
            let context = {};

            db.getUserTemplateNames(userId)
                .then(results => {
                    context.templates = results;
                })
                .catch(err => {
                    if (err) console.log(err);
                })
                .finally(() => {
                    res.send(context);
                })
        });

    app.post('/add_new_subscription_with_template_file', db.authenticationMiddleware(), upload.single('upload'),
        function (req, res) {
            const userId = req.session.passport.user.userId;
            var context = {};

            misc.validateFile(req.file, context)
                .then(() => db.insertNewSubscriptionWithTemplateFile(userId,
                    req.body.postId,
                    req.file.originalname,
                    req.file.buffer, '',
                    context))
                .then(() => db.getUserSubscriptionById(context.subscriptionId))
                .then(sub => {

                    context = sub;
		    context.effectiveDate = misc.toHumanDate(sub.effectiveDate);
		    
                    return misc.jwtSign({
                        templateId: sub.templateId,
                        post: sub.post,
                        country: sub.country,
                        subscriptionId: sub.subscriptionId
                    })
                        .then(tok => {
                            context.tok = tok;
                        })
                })
                .then(() => {
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);
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
            const userId = req.session.passport.user.userId;

            db.insertNewSubscriptionWithPrevTemplate(userId,
                req.body.postId,
                req.body.templateId, '',
                context)
                .then(() => db.getUserSubscriptionById(context.subscriptionId))
                .then(sub => {
                    context = sub;
		    context.effectiveDate = misc.toHumanDate(sub.effectiveDate);
		    
                    return misc.jwtSign({
                        templateId: sub.templateId,
                        post: sub.post,
                        country: sub.country,
                        subscriptionId: sub.subscriptionId
                    })
                        .then(tok => {
                            context.tok = tok;
                        })
                })
                .then(() => {
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);
                    context.success = false;
                    context.error = err;
                })
                .finally(() => {
                    res.send(context);
                })
        });
    app.get('/preview_template', db.authenticationMiddleware(),
        function (req, res) {
            var userId = req.session.passport.user.userId;
            var context = {};

            //if user is trying to preview default template, change user
            //id to match the default template user id for sql query
            if (req.query.templateId == process.env.DEFAULT_TEMPLATE_ID) {
                userId = process.env.DEFAULT_TEMPLATE_USER_ID;
            }

            misc.previewTemplate(userId, req.query.templateId, context)
                .then(() => {
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);

                    context.msg = "Error retrieving file";
                    context.success = false;
                })
                .finally(() => {
                    res.send(context);
                })
        });

    app.get('/download_template', db.authenticationMiddleware(),
        function (req, res) {
            var userId = req.session.passport.user.userId;
            var context = {};

            //if user is trying to preview default template, change user
            //id to match the default template user id for sql query
            if (req.query.templateId == process.env.DEFAULT_TEMPLATE_ID) {
                userId = process.env.DEFAULT_TEMPLATE_USER_ID;
            }

            db.getUserTemplate(userId, req.query.templateId)
                .then(response => {
                    context.filename = response[0].name;
                    context.uploaded = response[0].uploaded;
                    context.file = response[0].file;
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);
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
            var userId = req.session.passport.user.userId;
            var context = {};
            var decrypted;

            misc.jwtVerify(req.query.tok)
                .then(dec => {
                    decrypted = dec;

                    //if user is using default template, change user
                    //id to match the default template user id for sql query
                    if (decrypted.templateId == process.env.DEFAULT_TEMPLATE_ID) {
                        userId = process.env.DEFAULT_TEMPLATE_USER_ID;
                    }

                    return db.getUserTemplate(userId, decrypted.templateId);
                })
                .then(response => {
                    context.filename = response[0].name;
                    context.uploaded = response[0].uploaded;
                    context.file = response[0].file;
                    context.success = true;
                    return db.getColaRate(decrypted.country, decrypted.post);
                })
                .then(postInfo => {
                    context.file = tm.manipTemplate(context, postInfo[0]);
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);
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
            var userId = req.session.passport.user.userId;
            var context = {};
            var user = {};
            var decrypted;

            misc.jwtVerify(req.query.tok)
                .then(dec => {
                    decrypted = dec;
                    return db.getUserById(userId, user);
                })
                .then(() => {
                    //if user is using default template, change user
                    //id to match the default template user id for sql query
                    if (decrypted.templateId == process.env.DEFAULT_TEMPLATE_ID) {
                        userId = process.env.DEFAULT_TEMPLATE_USER_ID;
                    }

                    return db.getUserTemplate(userId, decrypted.templateId);
                })
                .then(response => {
                    user.filename = response[0].name;
                    user.subscriptionId = decrypted.subscriptionId;
                    context.filename = response[0].name;
                    context.uploaded = response[0].uploaded;
                    context.file = response[0].file;
                    return db.getColaRate(decrypted.country, decrypted.post);
                })
                .then(postInfo => {
                    context.username = user.email;
                    context.file = tm.manipTemplate(context, postInfo[0]);

                    return emails.sendEmail(user, postInfo[0], context.file);
                })
                .then(() => {
                    context.success = true;
                })
                .catch(err => {
                    if (err) console.log(err);
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
            var userId = req.session.passport.user.userId;
            var context = {};
            //		var decrypted;
            misc.jwtVerify(req.query.tok)
                .then(dec => {
                    //if user is trying to preview default template, change user
                    //id to match the default template user id for sql query
                    if (dec.templateId == process.env.DEFAULT_TEMPLATE_ID) {
                        userId = process.env.DEFAULT_TEMPLATE_USER_ID;
                    }
                    return misc.previewTemplate(userId, dec.templateId, context, dec);
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
            const userId = req.session.passport.user.userId;
            var context = {};
            var decrypted;

            misc.jwtVerify(req.query.tok)
                .then(dec => {
                    context.country = dec.country;
                    context.post = dec.post;
                    decrypted = dec;
                    return db.updateUserSubscription(dec.subscriptionId,
                        userId,
                        !!dec.makeActive);
                })
                .then(res => {
                    if (res.changedRows > 0) {
                        decrypted.makeActive = !decrypted.makeActive;
                        context.deleted = decrypted.makeActive;
                        context.restored = !decrypted.makeActive;
                    }
                    else {
                        throw new Error(`Unable to update subscriptionId`
                            + `=${decrypted.subscriptionId} to`
                            + ` active=${!!decrypted.makeActive}`
                            + ` for userId=${userId}`);
                    }

                    return misc.jwtSign(decrypted);
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
        const userId = req.session.passport.user.userId;
        var context = {};

        misc.validatePassword(userId, req.body.oldPassword,
            req.body.newPassword, req.body.newPasswordRe, context)
            .then(() => misc.hashPassword(req.body.newPassword))
            .then(hashedPwd => db.updateUserPassword(userId, hashedPwd))
            .then(() => {
                context.passwordUpdated = true;
                context.successMessage = 'Password changed';
            })
            .catch(err => {
                if (err) console.log(err);
                context.passwordUpdated = false;
            })
            .finally(() => res.send(context))
    });


    app.post('/reset_password', function (req, res) {

        var context = {};
        var encryptedPassword;
        db.getUserById(req.body.userId, context)
            .then(encPassword => {
                encryptedPassword = encPassword;
                return misc.jwtVerify(
                    req.body.token,
                    (encPassword + context.modified));
            })
            .then(dec => {
                return misc.validatePasswordReset(context.userId, encryptedPassword,
                    req.body.newPassword, req.body.newPasswordRe,
                    context);
            })
            .then(() => misc.hashPassword(req.body.newPassword))
            .then(hashedPwd => db.updateUserPassword(context.userId, hashedPwd))
            .then(() => {
                context.passwordUpdated = true;
                context.successMessage = 'Password changed';
            })
            .catch(err => {
                if (err) console.log(err);
                context.passwordUpdated = false;
            })
            .finally(() => res.send(context))

    });

    app.post(`/create_account`, function (req, res, next) {
        var context = {};
        var email = req.body.email;
        var pwd = req.body.password;
        var pwdRe = req.body.passwordRe;

        misc.validateEmail(email, context)
            .then(() => db.checkIfUserExists(email, context))
            .then(() => misc.validatePasswordNewAccount(pwd, pwdRe, context))
            .then(() => misc.hashPassword(pwd))
            .then(hashedPwd => db.addUser(email, hashedPwd, context))
            .then(dbRes => db.getUserById(dbRes.insertId, context))
            .then(() => {
                context.accountCreated = true;
                // create two tokens:
                // one that we will email the user and can be used to verify account
                // a second that we will return to the user. Allow the user to follow redirect,
                // then use token to decide how to render redirect page.
                let emailToken = misc.jwtSign({
                    userId: context.userId,
                    email: context.username,
                    verify: true
                }, process.env.JWT_SECRET);

                let returnToken = misc.jwtSign({
                    userId: context.userId,
                    email: context.username,
                    verificationSent: true,
                    verify: false
                }, process.env.JWT_SECRET);

                return Promise.all([emailToken, returnToken]);
            })
            .then(tokens => {
                let emailToken = tokens[0];
                context.returnToken = tokens[1];

                context.success = true;
                context.redirect = `/verify?tok=${context.returnToken}`;

                //now send email
                return emails.sendVerificationEmail(email, emailToken);

            })
            .catch(err => {
                console.log('error route');
                if (err) console.log(err);
                context.accountCreated = false;
                context.error = true;
            })
            .finally(() => res.send(context))

    });

    app.post(`/requestVerificationCode`, function (req, res, next) {
        var context = {};
        var email = req.body.username;

        // no need to validate email. Just check if email exists in our
        // db (avoiding sql injection) and send email if it is.
        db.getUserByEmail(email, context)
            .then(() => {
                if (context.isVerified) {
                    context.alreadyVerified = true;
                    throw new Error(`${email} already verified.`);
                    return;
                }
                // create two tokens (same process as create_account post route):
                // one that we will email the user and can be used to verify account
                // a second that we will return to the user. Allow the user to follow redirect,
                // then use token to decide how to render redirect page.
                let emailToken = misc.jwtSign({
                    userId: context.userId,
                    email: context.username,
                    verify: true
                }, process.env.JWT_SECRET);

                let returnToken = misc.jwtSign({
                    userId: context.userId,
                    email: context.username,
                    verificationSent: true,
                    verify: false
                }, process.env.JWT_SECRET);

                return Promise.all([emailToken, returnToken]);
            })
            .then(tokens => {
                let emailToken = tokens[0];
                context.returnToken = tokens[1];

                context.success = true;
                context.redirect = `/verify?tok=${context.returnToken}`;

                //now send email
                return emails.sendVerificationEmail(email, emailToken);

            })
            .catch(err => {
                if (err) console.log(err);

                context.error = true;
            })
            .finally(() => res.send(context))

    });


    /********************* End Account page ajax routes *********************/
    /********************* Start FAQ page ajax routes *********************/
    app.get('/preview_default_template', function (req, res) {
        const defaultUserId = process.env.DEFAULT_TEMPLATE_USER_ID;
        const defaultTemplateId = process.env.DEFAULT_TEMPLATE_ID;
        var context = {};
        misc.previewTemplate(defaultUserId, defaultTemplateId, context)
            .then(() => {
                context.success = true;
            })
            .catch(err => {
                if (err) console.log(err);

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

        if (!req.query.tok) {
            console.log(`Invalid token: ${req.query.tok}`);
            context.error = true;
            context.deleted = false;
            misc.setLayout(req, context)
                .catch(() => console.log('error in set_layout'))
                .finally(() => res.render('unsubscribetok', context))
            return;
        }

        misc.jwtVerify(req.query.tok)
            .then(dec => {
                console.log(dec);
                decrypted = dec;

                context.country = dec.country;
                context.post = dec.post;
                context.username = dec.username;

                return db.updateUserSubscription(dec.subscriptionId, dec.userId, dec.makeActive);
            })
            .then(dbres => {
                context.unsubscribed = !decrypted.makeActive;
                context.resubscribed = decrypted.makeActive;
                if (dbres.changedRows == 0)
                    context.alreadyUpdated = true;
                else if (dbres.changedRows > 0)
                    context.updated = true;

                return misc.jwtSign({
                    username: decrypted.username,
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
                return db.getNumberUserRedundantSubscriptions(decrypted.userId,
                    decrypted.postId,
                    decrypted.post,
                    decrypted.country);
            })
            .then(dbres => {
                if (dbres.numberSubscriptions > 0) {
                    context.additionalSubs = true;
                    context.numberAdditionalSubs = dbres.numberSubscriptions;
                }
                return misc.setLayout(req, context);
            })
            .then(() => {
                res.render('unsubscribetok', context);
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
        db.checkEmail(req.body.email, context)
            .then(encPassword => {
                return misc.jwtSign({
                    userId: context.userId,
                    email: context.email
                }, (encPassword + context.modified), "1h")
            })
            .then(token => emails.passwordResetEmail(context.userId, context.email, token))
            .then(() => {
                console.log('success');
                context.success = true;
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    context.msg = "An error occured";
                    context.error = true;
                }
            })
            .finally(() => {
                return misc.setLayout(req, context);
            })
            .finally(() => {
                res.send(context);
            })

    });
    
    /***************************************************/
    /* functionallity for get all user info page here  */
    /***************************************************/
        app.get('/delete_subscription', db.authenticationMiddleware(),
        function (req, res) {
            const userId = req.session.passport.user.userId;
            var context = {};
            

	})
}

