const db = require('./db_functions.js');
const tm = require('./template_manip.js');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const randomAccessFile = require('random-access-file');
const nodemailer = require('nodemailer');
var Email = require('email-templates');
var transporter = nodemailer.createTransport('smtps://gunrock2018%40gmail.com:iamaweimaraner@smtp.gmail.com')
/*
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
	user: 'gunrock2018@gmail.com',
	pass: 'iamaweimaraner'
    },
//    jsonTransport: true
});
*/

module.exports = {
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
	    try{
		db.get_users_subscribed_to_post(changed.post, changed.country)
		    .then(users => users.forEach(user => {
			const file = tm.manip_template(
			    user.username,
			    user.filename,
			    user.file,
			    changed.post,
			    changed.country,
			    changed.previous_allowance,
			    changed.allowance,
			    changed.last_modified
			);
			let email_promise = send_email(user.username, user.filename, file, changed)
			    .then((res) => {
				console.log(`Email sent to ${user.username} with '${user.filename}'`
					    + ` attached. ${changed.post}, ${changed.country}: `
				 	    + `prev_rate: ${changed.previous_allowance}, `
					    + `new_rate: ${changed.allowance}`);
			    })
		    }))
		    .catch(err => {
			console.log(err);
			throw 'Error sending email';
		    })
		
	    }
	    catch(err){
		console.log(err);
		console.log(`Error: unable to send emails for `
			    + `${changed.post}, ${changed.country}.`);
	    }
	});
	
    }
}

/*
  name: send_email
  preconditions: username is valid user email
                 filename is name of file that we will be sending to user. filename 
		 has already been creaed in server/templates/temp/${filename}
		 file contains buffer of file that needs to be sent, already with rates
		 changed inside document
  postconditions: email has been sent to user with attachment
  description: Returns a promise that fulfills after all actions completed. 
               1. make a directory with user's email as name of directory
	       2. writes file into that directory
	       3. send user email
	       4. remove newly created directory and file
*/
/*
function send_email(username, filename, file, changed){
//function send_email(username, filename, filepath){
    return new Promise((resolve, reject) => {
	const date_long = new Intl.DateTimeFormat('en-US', {month: 'long'})
	      .format(changed.last_modified);
	const mail_options = {
	    from: 'gunrock2018@gmail.com',
	    to: username,
	    subject: `MGMT Notice: COLA Rate Change ${changed.post}, ${changed.country}`,
	    html: `<p>Effective ${changed.last_modified.getUTCDate()} ${date_long},`
		+ ` ${changed.last_modified.getUTCFullYear()}, the COLA rate for ${changed.post}, `
		+ `${changed.country} has changed from `
		+ `<b>${changed.previous_allowance}%</b> to <b>${changed.allowance}%</b>.</p>`,
	    attachments: [
		{
		    filename: filename,
		    content: file
		}
	    ]   
	}
	transporter.sendMail(mail_options, (err, info) =>{
	    if(err) reject(err);
	    console.log(info);
	    resolve(info);
	})
    })
    }
*/

function send_email(username, filename, file, changed, jwt='not_implemented'){
    return new Promise((resolve, reject) => {
	const month_long = new Intl.DateTimeFormat('en-US', {month: 'long'})
	      .format(changed.last_modified);
	
	const email = new Email({
	    message: {
		from: 'gunrock2018@gmail.com',
		attachments: [
		    {
			filename: filename,
			content: file
		    },
		    {
			filename: 'badge.png',
			path: path.join(__dirname, '..', '/emails/build/img/badge.png'),
			cid: 'badge@nodemailer.com'
		    }
		]
	    },
	    send: true,
	    transport: transporter,
//	    transport: {
//		jsonTransport: true
//	    },

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
	
	email.send({
	    template: `rate_change`,
	    message: {
		to: username
	    },
	    locals: {
		locale: 'en',
		username: username,
		changed: changed,
		date: changed.last_modified.getUTCDate(),
		month: month_long,
		year: changed.last_modified.getUTCFullYear(),
		jwt: jwt,
		style: ['rate_change_email.css']
	    }
	})
	    .then(resolve)
	    .catch(err => {
		console.error(err);
		reject();
	    })
    })
}
