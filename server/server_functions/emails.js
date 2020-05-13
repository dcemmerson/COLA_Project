//require('dotenv').config();
const db = require('./db_functions.js');
const tm = require('./template_manip.js');
const misc = require('./misc.js');
const path = require('path');
const randomAccessFile = require('random-access-file');
//const nodemailer = require('nodemailer');
//var sgTransport = require('nodemailer-sendgrid-transport');
var Email = require('email-templates');


const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
    
    password_reset_email: function (userId, email, token) {
	
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
    send_verification_email: function (email, token) {
	
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

		    //ugly but necessary to then chain this rather than return it
		    send_email(user, changed, file)
			.then(resMsg => {
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
    },
    send_email: function(user, changed, file){
	return send_email(user, changed, file);
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

    const month_long = new Intl.DateTimeFormat('en-US', {month: 'long'})
	  .format(changed.effectiveDate);
    
    return misc.jwt_sign({username: user.username,
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
		    month: month_long,
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
		    month: month_long,
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

