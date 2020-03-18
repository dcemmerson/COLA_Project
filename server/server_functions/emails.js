const db = require('./db_functions.js');
const tm = require('./template_manip.js');
const fs = require('fs');
const rimraf = require('rimraf');
const randomAccessFile = require('random-access-file');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
	user: 'gunrock2018@gmail.com',
	pass: 'iamaweimaraner'
    }
});

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
			    changed.allowance);
			send_email(user.username, user.filename, file)
//			send_email(user.username, file_info.filename, file_info.filepath)
			    .then((res) => {
				console.log(`Email sent to ${user.username} with '${user.filename}'`
					    + ` attached. ${changed.post}, ${changed.country}: `
				 	    + `prev_rate: ${changed.previous_allowance}, `
					    + `new_rate: ${changed.allowance}`);
			    })
		    }))
		    .catch(err => {
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
function send_email(username, filename, file){
//function send_email(username, filename, filepath){
    return new Promise((resolve, reject) => {
	const path = `${__dirname}`
//	mkdir(path)
	write_file(path, filename, file)
	    .then(() => {
		console.log(`trying to send ${filename} from ${path}`);
		
		const mail_options = {
		    from: 'gunrock2018@gmail.com',
		    to: username,
		    subject: 'Hello there',
		    html: '<p>hello, see attachment</p>',
		    attachments: [
			{
			    filename: filename,
			    content: 'Buffer',
			    path: `/${path}/${filename}`
			}
		    ]   
		}
		console.log('mail option path = ' + mail_options.attachments[0].path);
		console.log('mail option filename = ' + mail_options.attachments[0].filename);
		return new Promise((resolve, reject) => {
		    transporter.sendMail(mail_options, (err, info) =>{
			if(err) reject(err);
			console.log(info);
			resolve(info);
		    })
		    
		});
	    })
//	    .then(() => transporter.sendMail(mail_options))
	//	    .then(() => rmdir(path))
	    .then(() => delete_file(path, filename))
	    .then(() => resolve())
	    .catch(err => reject(err));
	
    });
}

function mkdir(path){
    return new Promise((resolve, reject) => {
	fs.mkdir(`${path}`, err => reject(err));
	resolve();
    })
}
function rmdir(path){
    return new Promise((resolve, reject) => {
	rimraf(`${path}`, err => {
	    if(err) reject(err);
	    resolve();
	})
    })
}
function write_file(path, filename, buffer){
    return new Promise((resolve, reject) => {
	let file = randomAccessFile(`${path}/${filename}`);
	file.write(0, buffer, err => {
	    if(err) {
		console.log(err);
		reject(err);
	    }
	    resolve();
	});
    });
}
function delete_file(path, filename){
    return new Promise((resolve, reject) => {
	fs.unlink(`${path}/${filename}`, err => {
	    if(err){
		console.log(err);
		reject(err);
	    }
	    resolve();
	})
    })
}
