require('dotenv').config();
const db = require('./db_functions.js');
const tm = require('./template_manip.js');
const misc = require('./misc.js');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const randomAccessFile = require('random-access-file');
const nodemailer = require('nodemailer');
var Email = require('email-templates');
const transporter = nodemailer.createTransport('smtps://gunrock2018%40gmail.com:iamaweimaraner@smtp.gmail.com')
const HOST = process.env.HOST || 'http://localhost:10000';

module.exports = {
	
	password_reset_email: function (email, id, pwd, created) {
	console.log(id);
	var jwt = require('jwt-simple');

	var payload = { userId: id,
					email:email};
	var secret = pwd+created;
	var token = jwt.encode(payload, secret);
	
	console.log(payload.userId, token);

		const forgot_email = new Email({
			message: {
				from: 'gunrock2018@gmail.com'
			},
			// uncomment below to send emails in development/test env:
			send: true,
			transport: transporter,
			//	transport: {
			//	jsonTransport: true
			//	}
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

		forgot_email.send({
				template: `forgot_pwd`,
				message: {
					to: 'shif.schectman@gmail.com'
				},
				locals: {
					locale: 'en',
				id: payload.userId ,
				token: token,
				}
			})
			.then(console.log)
			.catch(console.error);
},
    /* name: send_emails
       preconditions: changed_rates contains array of objects that contains each
       post that has changed cola rate, including information db id,
       country, post, previous_allowance, and allowance (new allowance)
       postconditions: emails have been sent to all users subscribed to posts
       whose rates have changed
       description:
    */
    start_sending_emails: function(changed_rates){
	changed_rates.forEach(changed => {
	    db.get_users_subscribed_to_post(changed.postId)
		.then(users => users.forEach(user => {
		    const file = tm.manip_template(user, changed);
		    send_email(user, changed, file)
			.then((res) => {
			    console.log(`Email sent to ${user.username} with '${user.filename}'`
					+ ` attached. ${changed.post}, ${changed.country}: `
				 	+ `prev_rate: ${changed.previous_allowance}, `
					+ `new_rate: ${changed.allowance}`);
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
    }
}

/*
  name: send_email
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
function send_email(user, changed, file){
//function send_email(username, filename, file, changed, userId, subscriptionId){
    return new Promise((resolve, reject) => {
	const month_long = new Intl.DateTimeFormat('en-US', {month: 'long'})
	      .format(changed.last_modified);
	
	misc.jwt_sign({username: user.username,
		       subscriptionId: user.subscriptionId,
		       userId: user.userId,
		       post: changed.post,
		       country: changed.country,
		       postId: changed.postId,
		       makeActive: false
		      })
	    .then(token => {
		const email = new Email({
		    message: {
			from: 'gunrock2018@gmail.com',
			attachments: [
			    {
				filename: user.filename,
				content: file
			    },
			    {
				filename: 'badge.png',
				path: path.join(__dirname, '..', '/emails/build/img/badge.png'),
					  cid: 'badge@nodemailer.com'
			    }]
		    },
		    send: true,
		    transport: transporter,	    
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
		
		return email.send({
		    template: `rate_change`,
		    message: {
			to: user.username
		    },
		    locals: {
			locale: 'en',
			username: user.username,
			changed: changed,
			date: changed.last_modified.getUTCDate(),
			month: month_long,
			year: changed.last_modified.getUTCFullYear(),
			host: HOST,
			jwt: token,
			errorFilename: user.errorFilename,
			fileError: user.fileError,
			style: ['rate_change_email.css']
		    }
		})
	    })//then
	    .then(resolve)
	    .catch(err => {
		console.error(err);
		reject();
	    })
    })
}



