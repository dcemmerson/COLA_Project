/*  filename: emails.js
    last modified: 06/23/2020
    description: File contains functions specific to sending emails,
                    including rendering email templates, making db
                    calls to functions in db_functions.js, and making
                    calls to edit user uploaded templates to functions
                    in template_manip.js.
*/

const db = require('./db_functions.js');
const tm = require('./template_manip.js');
const misc = require('./misc.js');
const path = require('path');
const randomAccessFile = require('random-access-file');

var Email = require('email-templates');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {

    /* name: passwordResetEmail
       preconditions: userId corresponds to user.id in db for user requestin
                        password reset. userId is necessary solely to decrypt
			the token when user clicks link in email, to select
			the lastModified field in user, and combine that
			with our JWT_SECRET to create 1 time use link
		      email is requesting user email
		      token is encrypted jwt containing userId and email, and
		        is signed with 1 time secret, user.lastModified + JWT_SECRET
       postconditions: password reset email sent to user
    */
    passwordResetEmail: function (userId, email, token) {

        const em = new Email({
            view: {
                options: {
                    extension: 'handlebars'
                },
                juice: true,
                juiceResources: {
                    preserveImportant: true,
                    webResources: {
                        relativeTo: path.join(__dirname, '..', '/emails/build'),
                        images: true
                    }
                }
            }
        });

        let awaitPromises = [
            em.render('forgot_pwd/html.handlebars', {
                locale: 'en',
                title: "Reset password",
                email: email,
                host: process.env.HOST,
                userId: userId,
                jwt: token,
            }),
            em.render('forgot_pwd/text.handlebars', {
                locale: 'en',
                title: "Reset password",
                email: email,
                host: process.env.HOST,
                userId: userId,
                jwt: token,
            })
        ];

        return Promise.all(awaitPromises)
            .then(res => {
                const msg = {
                    from: process.env.FROM_EMAIL,
                    to: email,
                    subject: 'COLA Password Reset Request',
                    text: res[1],
                    html: res[0]
                };
                console.log('now send');
                return sgMail.send(msg);
            })

    },

    /* name: sendVerificationEmail
       preconditions: email corresponds to user email who is attempting to create account
		      token is encrypted jwt containing userId, email, and boolean field
		        verify, which should be set to true here, signed with JWT_SECRET
       postconditions: account verification email sent to user
    */
    sendVerificationEmail: function (email, token) {

        const em = new Email({
            view: {
                options: {
                    extension: 'handlebars'
                },
                juice: true,
                juiceResources: {
                    preserveImportant: true,
                    webResources: {
                        relativeTo: path.join(__dirname, '..', '/emails/build'),
                        images: true
                    }
                }
            }
        });

        let awaitPromises = [
            em.render('verification_email/html.handlebars', {
                locale: 'en',
                title: "Action required: Verify your email",
                email: email,
                host: process.env.HOST,
                jwt: token,
            }),
            em.render('verification_email/text.handlebars', {
                locale: 'en',
                title: "Action required: Verify your email",
                email: email,
                host: process.env.HOST,
                jwt: token,
            })
        ];

        return Promise.all(awaitPromises)
            .then(res => {
                const msg = {
                    from: process.env.FROM_EMAIL,
                    to: email,
                    subject: 'Action required: Verify your email for COLA notification system',
                    text: res[1],
                    html: res[0]
                };
                console.log('now send');
                return sgMail.send(msg);
            })
    },

    /* name: sendEmails
       preconditions: changedRates contains array of objects that contains each
                        post that has changed cola rate, including information db id,
		        country, post, previousAllowance, and allowance (new allowance)
       postconditions: emails have been sent to all users subscribed to posts
                         whose rates have changed
    */
    startSendingEmails: function (changedRates) {

        changedRates.forEach(changed => {
            db.getUsersSubscribedToPost(changed.postId)
                .then(users => users.forEach(user => {
                    const file = tm.manipTemplate(user, changed);

                    //ugly but necessary to then chain this rather than return it
                    sendEmail(user, changed, file)
                        .then(resMsg => {
                            console.log(`Email sent to ${user.username} with '${user.filename}'`
                                + ` attached. ${changed.post}, ${changed.country}: `
                                + `prevrate: ${changed.previousAllowance}, `
                                + `newrate: ${changed.allowance}`);
                        })
                        .catch(err => { //error related to manip template/sending email
                            console.log(err);
                            console.log(`Error: unable to send email to ${user.username} with`
                                + ` ${user.filename} for `
                                + `${changed.post}, ${changed.country}.`);
                        })
                }))
                .catch(err => { //error related to db query, or worse...
                    console.log(err);
                    console.log(`Error: unable to send emails for `
                        + `${changed.post}, ${changed.country}.`);
                })
        });
    },
    sendEmail: function (user, changed, file) {
        return sendEmail(user, changed, file);
    }
}

/*
  name: sendEmail
  preconditions: user contains object with filename, user id pk from db,
                   subscription id pk from db
		 changed contains object with post id pk from db, post name,
		   country name.
		 file contains buffer in which manipulated docx (or .txt file if
		   user uploaded invalid/corrupted file) is contained
  postconditions: emails has been sent to user
  description: Send email to user. Email template rate_change is used in email.
               Inside email, file is attached with rate change information. HTML
	       formatted text is contained inside email. Additionally, json
	       web tokens are used in html anchor link inside email to allow
	       user easy one-click unsubscribe.
*/
function sendEmail(user, changed, file) {

    const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long' })
        .format(changed.effectiveDate);

    return misc.jwtSign({
        username: user.username,
        subscriptionId: user.subscriptionId,
        userId: user.userId,
        post: changed.post,
        country: changed.country,
        postId: changed.postId,
        makeActive: false
    })
        .then(token => {

            const em = new Email({

                views: {
                    options: {
                        extension: 'handlebars'
                    }
                },
                juice: true,
                juiceResources: {
                    preserveImportant: true,
                    webResources: {
                        relativeTo: path.join(__dirname, '..', '/emails/build'),
                        images: true
                    }
                }
            });

            let awaitPromises = [
                em.render('rate_change/html.handlebars', {
                    locale: 'en',
                    title: `COLA Rate Change ${changed.country} (${changed.post})`,
                    username: user.username,
                    changed: changed,
                    date: changed.effectiveDate.getUTCDate(),
                    month: monthLong,
                    year: changed.effectiveDate.getUTCFullYear(),
                    host: process.env.HOST,
                    jwt: token,
                    errorFilename: user.errorFilename,
                    fileError: user.fileError,
                    style: ['rate_change_email.css']
                }),
                em.render('rate_change/text.handlebars', {
                    locale: 'en',
                    title: `COLA Rate Change ${changed.country} (${changed.post})`,
                    username: user.username,
                    changed: changed,
                    date: changed.effectiveDate.getUTCDate(),
                    month: monthLong,
                    year: changed.effectiveDate.getUTCFullYear(),
                    host: process.env.HOST,
                    jwt: token,
                    errorFilename: user.errorFilename,
                    fileError: user.fileError,
                    style: ['rate_change_email.css']
                })
            ];

            return Promise.all(awaitPromises)
                .then(res => {
                    const msg = {
                        from: process.env.FROM_EMAIL,
                        to: user.username,
                        subject: `COLA Rate Change ${changed.country} (${changed.post})`,
                        text: res[1],
                        html: res[0],
                        attachments: [{
                            filename: user.filename,
                            content: Buffer.from(file).toString('base64')
                        }]

                    };

                    return sgMail.send(msg);
                })

        })
}

