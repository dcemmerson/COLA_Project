const db = require('./db_functions.js');
const tm = require('./template_manip.js');

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
		    .then(users => users.forEach(user =>{
			tm.manip_template(user.username,
					  user.filename,
					  changed.post,
					  changed.country,
					  changed.previous_allowance,
					  changed.allowance);
			send_email(user.username, user.filename);
			console.log(`Email sent to ${user.username} with ${user.filename}`
				    + ` attached. ${changed.post}, ${changed.country}: `
				    + `prev_rate: ${changed.previous_allowance}, `
				    + `new_rate: ${changed.allowance}`);
		    }))
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
		 has already been created in server/templates/temp/${filename}
  postconditions: email has been sent to user with attachment
  description:
*/
function send_email(username, filename){
    console.log(`This is where the email would be sent to ${username}.`);
}

