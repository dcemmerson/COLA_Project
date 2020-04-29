var passport = require('passport');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;

//require('../server.js'); //seems like this is a bit of a circular reference?
const saltRounds = 10;
//var jwt = require('jwt-simple');
var mysql = require('../dbcon.js');
const DEFAULT_TEMPLATE_ID = process.env.DEFAULT_TEMPLATE_ID || 1;

/* name: queryDB
   preconditions: sql contains string sql query
                  values is array of arguments for sql statement
		  mysql is connection to db
   postconditions: returns Promise. Upon successful execution of sql statement
                   Promise resolves with results, else rejects with error message.
   description: queryDB is a helper function for querying database.
*/
function queryDB(sql, values, mysql) {
    return new Promise((resolve, reject) => {
	mysql.pool.query(sql, values, (err, results, fields) => {
	    if (err) {
		console.log('db query rejecting');
		reject(err);
	    } else resolve(results);
	});
    });
}

module.exports = {

    /* name: addUser
       preconditions: email is valid email format string
                      email should have already been checked if it exists in db
                      hashedPwd has been validated to conform to system password standards 
		          and has already been hashed
       postconditions: new user added to db with hashed password 
                       promise resolves, else reject if error along the way
    */
    add_user: function (email, hashedPwd, context) {
	return new Promise((resolve, reject) => {
	    const sql = "INSERT INTO user (email, password) VALUES (?, ?)"
	    const values = [email, hashedPwd];

	    queryDB(sql, values, mysql)
		.then(res => {
		    if(res.affectedRows == 1){
			resolve();
		    }
		    else{
			reject();
		    }
		})
		.catch(reject);
	    
	});
    },

    /* name: check_if_user_exists
       preconditions: email is provided by client
                      context is reference to object
       postconditions: promise resolves if email does not exist in db, else rejects
                       flags set in context if promise rejects
     */
    check_if_user_exists: function(email, context){
	return new Promise((resolve, reject) => {
	    const sql = "SELECT * FROM user WHERE email=?";
	    const values = [email];

	    queryDB(sql, values, mysql)
		.then(res => {
		    if(res.length > 0){
			context.userAlreadyExists = true;
			context.invalidMessage = "Account already taken";
			reject();
		    }
		    else{
			resolve();
		    }
		})
		.catch(reject)
	});
    },
    
    insert_user: function (email, pwd, now, res, req) {
	return new Promise((resolve, reject) => {
	    bcrypt.hash(pwd, saltRounds, function (err, hash) {
		const sql = "INSERT INTO user (`email`, `password`, `created`, `modified`) VALUES (?, ?, ?, ?)"
		let values = [email, hash, now, now];
		
		queryDB(sql, values, mysql)
		    .then(res => {
			resolve(res)
		    }).
		    catch(err => {			
			res.redirect('create_account')
			console.log(err);
			reject(err)
		    })
			})
	})
    }, 
    
    /* name: check_email
       preconditions: email is user supplied email
                      context is object we will fill with response information
       postconditions: context has been filled with user informtation found by
                       seraching db, if user exists
       description: Search db for user supplied email. If email exists, fill context
                    object with user information and resolve. Else, if no email found
		    set context.error to true, and reject. 
     */
    check_email: function (email, context) {
	var sql = "SELECT id, password, modified FROM user WHERE email=?"
	var values = [email];
	return new Promise((resolve, reject) => {
	    queryDB(sql, values, mysql)
		.then(result => {
		    if (result.length == 0) {
			//email does not exist
			context.notFound = true;
			context.msg = "Email does not exist";

			reject();
		    }
		    else {
			context.userId = result[0].id;
			context.modified = result[0].modified;
			resolve(result[0].password);
		    }    
		})
		.catch(err => {
		    reject(err);
		});
	})
    },
    /* name: get_user_by_id
       preconditions: userId to search for in db
                      context is object we will fill with response information
       postconditions: context has been filled with user informtation found by
                       seraching db, if user exists
       description: Search db for id. If user exists, fill context
                    object with user information and resolve. Else, if no user found
		    set context.error to true, and reject. 
     */
    get_user_by_id: function (userId, context) {
	var sql = "SELECT id, email, password, modified FROM user WHERE id=?"
	var values = [userId];
	return new Promise((resolve, reject) => {
	    queryDB(sql, values, mysql)
		.then(result => {
		    if (result.length == 0) {
			//email does not exist
			context.notFound = true;
			context.msg = "User does not exist";

			reject();
		    }
		    else {
			context.userId = result[0].id;
			context.email = result[0].email;
			context.modified = result[0].modified;
			resolve(result[0].password);
		    }    
		})
		.catch(err => {
		    reject(err);
		});
	})
    },
    
    get_user_by_email: function (email, context) {
	var sql = "SELECT id, email, password, modified FROM user WHERE id=?"
	var values = [email];
	return new Promise((resolve, reject) => {
	    queryDB(sql, values, mysql)
		.then(result => {
		    if (result.length == 0) {
			//email does not exist
			context.notFound = true;
			context.msg = "User does not exist";

			reject();
		    }
		    else {
			context.userId = result[0].id;
			context.email = result[0].email;
			context.modified = result[0].modified;
			resolve(result[0].password);
		    }    
		})
		.catch(err => {
		    reject(err);
		});
	})
    },
    
    
    get_user: function (req, res, id, token) {
	var sql = "SELECT password, created FROM user WHERE id= ?"
	var values = [id];
	queryDB(sql, values, mysql).then((message) => {
	    if (message.length==0) 
	    {
		console.log("error");
		res.redirect('/login');
	    }
	    else 
	    {
		const user_pwd=(message[0].password);
		const user_created=(message[0].created);
		var secret = user_pwd +user_created;

		//whys there a try/catch here?
		try{
		    const decoded = jwt.decode(token, secret);
		    let context = {};
			context.style = ['styles.css', 'font_size.css', 'account.css'];
			context.script = ['recover.js', 'recover_ajax.js', 'utility.js'];
		//    context.id = id;
		    res.render('recover',/* {
			id: id,
			//	token: token
		    */ context)
		}catch(err) {if(err) res.redirect('/login');
			     
			    };
		
	    }
	    

	})
    },
    
    update_user: function (id, pwd) {
	return new Promise((resolve, reject) => {
	    bcrypt.hash(pwd, saltRounds, function (err, hash) {
		const now = new Date().toISOString().replace(/\..+/, '')
		const sql = `UPDATE user SET password=?, modified=? WHERE id=?`
		const values = [hash, now, id];
		queryDB(sql, values, mysql)
		    .then(res => resolve(res))
		    .catch(err => console.log(err))
	    })
	});
    },
    
    


    authenticationMiddleware: function () {
	return (req, res, next) => {
	    if (req.isAuthenticated()) return next();
	    res.redirect('/login');
	}
    },
    /*******************************************************************/
    /********************* COLA RATE SCRIPT QUERIES ********************/
    /*******************************************************************/
    /* name: add_cola_rates
       preconditions: scraped contains array of objects of the form 
       postconditions: returns Promise that doesnt resolve until all
       have been successfully added to db. 
       description: This function should only need to be called to 
       initialize db. All cola rates contained in scraped
       are inserted into db. If any inserts fail, error 
       message printed and function returns immediately.
    */
    add_cola_rates: function (scraped) {
	return new Promise((resolve, reject) => {
	    let queries = [];
	    const sql = `INSERT INTO COLARates (country, post, allowance, last_modified) VALUES (?, ?, ?, now())`
	    scraped.forEach(entry => {
		let values = [entry.country, entry.post, entry.allowance];
		queries.push(queryDB(sql, values, mysql));
	    })
	    Promise.all(queries)
		.then((res) => resolve(res))
		.catch(err => {
		    console.log(err);
		    return;
		})
	})
    },
    /* name: add_cola_rate
       preconditions: scraped contains array of objects of the form 
       postconditions: returns Promise that doesnt resolve until all
       have been successfully added to db. 
       description: This function should only need to be called to 
       initialize db. All cola rates contained in scraped
       are inserted into db. If any inserts fail, error 
       message printed and function returns immediately.
    */
    add_cola_rate: function (country, post, allowance) {
	return new Promise((resolve, reject) => {
	    const sql = `INSERT INTO COLARates (country, post, allowance, last_modified) VALUES (?, ?, ?, now())`
	    let values = [country, post, allowance];
	    queryDB(sql, values, mysql)
		.then(res => {
		    resolve(res)
		})
		.catch(err => {
		    console.log(err);
		    reject(err)
		})
	})
    },
    /* name: get_cola_rate
       preconditions: country is string name of country which we need cola rate
       post is string name of post which we need cola rate
       postconditions: returns promise, which when resolved returns object with 
       id, country, post, and allowance as data members
       description:
    */
    get_cola_rate: function (country, post) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT * FROM COLARates WHERE country=? AND post=?`;
	    const values = [country, post];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	})

    },
    /* name: update_cola_rate
       preconditions: COLARate_id is is of corresponding post/country needing update
       new_allowance is new allowance obtained by scraping webpage
       postconditions: COLARate.id has been updated with new_allowance
       description:
    */
    update_cola_rate: function (COLARate_id, new_allowance) {
	return new Promise((resolve, reject) => {
	    const sql = `UPDATE COLARates SET allowance=?, last_modified=NOW() WHERE id=?`
	    const values = [new_allowance, COLARate_id];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    /* name: get_users_subsribed_to_post
       preconditions: post is name of post in db
       country is name of country that corresponds to post
       postconditions: return list of users subscribed to post, along with
       the template file for each user.
    */
    get_users_subscribed_to_post: function (postId) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT s.id AS subscriptionId, u.email AS username,`
		  + ` u.id AS userId, t.file, t.name AS filename`
		  + ` FROM user u`
		  + ` INNER JOIN subscription s ON  u.id=s.userId`
		  + ` INNER JOIN COLARates_subscription cs ON s.id=cs.subscriptionId`
		  + ` INNER JOIN COLARates cr ON cs.COLARatesId=cr.id`
		  + ` INNER JOIN template t ON s.templateId=t.id` 
		  + ` WHERE cr.id=? AND s.active=1`;
	    const values = [postId];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    /*******************************************************************/
    /******************* END  COLA RATE SCRIPT QUERIES *****************/
    /*******************************************************************/


    /*******************************************************************/
    /********************* SUBSCRIPTION PAGE QUERIES *******************/
    /*******************************************************************/
    /* name: get_list_of_posts
       preconditions: None 
       postconditions:  return Promise that returns list of posts when
       fulfilled
    */
    get_list_of_posts: function () {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT * FROM COLARates ORDER BY country ASC, post ASC`;
	    const values = [];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    /* name: get_user_subscription_list
       preconditions: user_id is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns list of user's 
       subscription when fulfilled
    */
    get_user_subscription_list: function (user_id) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT cr.post, cr.country, cr.allowance, cr.last_modified,`
		  + ` s.id AS subscriptionId, s.name, s.comment`
		  + ` FROM user u`
		  + ` INNER JOIN subscription s ON u.id=s.userId`
		  + ` INNER JOIN COLARates_subscription crs ON s.id=crs.subscriptionId`
		  + ` INNER JOIN COLARates cr ON crs.COLARatesId=cr.id`
		  + ` WHERE u.id=? AND s.active=1`
		  + ` ORDER BY cr.country ASC, cr.post ASC`;
	    const values = [user_id];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    /* name: get_user_template_names
       preconditions: userId is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns names and ids of all user's
       uploaded templates, plus the default system template.
    */
    get_user_template_names: function (userId) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT t.id, t.name, t.comment`
		  + ` FROM user u`
		  + ` INNER JOIN template t ON u.id=t.userId` 
		  + ` WHERE u.id=? || t.id=?`
		  + ` ORDER BY t.name ASC`;
	    const values = [userId, DEFAULT_TEMPLATE_ID];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => reject(err))
	});
    },
    /* name: get_user_email
       preconditions: user_id is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns email that corresponds
       to user_id in user table.
    */
    get_user_email: function (user_id) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT email FROM user WHERE id=?`;
	    const values = [user_id];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    
    
    /* name: insert_new_subscription_with_template_file
       preconditions: userId should be id of logged in user.
       name will be stored in name field - should match name of file
       file is validated docx file template uploaded by user
       comment is any comment the user added when uploading file.
       postconditions:  return Promise that fulfills after new subscription added
    */
    insert_new_subscription_with_template_file: function (user_id, post_id, filename, file, comment="") {
	return new Promise((resolve, reject) => {
	    let sql = `INSERT INTO template (name, file, comment, userId) VALUES (?, ?, ?, ?);`
	    
	    let values = [filename, file, comment, user_id]
	    
	    queryDB(sql, values, mysql)
		.then(res => {
		    sql = `INSERT INTO subscription (name, comment, userId, templateId, active) VALUES (?, ?, ?, ?, ?);`
		    values = ["", "", user_id, res.insertId, 1];
		    return queryDB(sql,values, mysql);
		})
	    	.then(res => {
		    sql = ` INSERT INTO COLARates_subscription (subscriptionId, COLARatesId) VALUES (?, ?);`
		    values = [res.insertId, post_id];
		    return queryDB(sql,values, mysql);
		})
		.then(() => resolve())
		.catch(err => console.log(err))
	});
    },
    /* name: insert_new_subscription_with_prev_template
       preconditions: user_id should be id of logged in user.
       comment is any comment the user added when uploading file.
       template_id is id corresponding to primary key in template table
       postconditions:  return Promise that fulfills after new subscription added
    */
    insert_new_subscription_with_prev_template: function (user_id, post_id, template_id, comment="") {
	return new Promise((resolve, reject) => {
	    let sql = `INSERT INTO subscription (name, comment, userId, templateId, active) VALUES (?, ?, ?, ?, ?);`
	    let values = ["", "", user_id, template_id, 1];
	    queryDB(sql, values, mysql)
	    	.then(res => {
		    sql = ` INSERT INTO COLARates_subscription (subscriptionId, COLARatesId) VALUES (?, ?);`
		    values = [res.insertId, post_id];
		    return queryDB(sql,values, mysql);
		})
	    	.then(() => resolve())
		.catch(err => console.log(err))
	});
    },
    /* name: update_user_subscription
       preconditions: user_id should be id of logged in user.
       subscription_id is id corresponding to primary key in subscription table
       that user wishes to delete
       active should be set to 1 or true if we want to reactive a subscription, 0 or false if
       we need to deactive/delete subscription
       postconditions:  return Promise that fulfills after subscription active field updated
    */
    update_user_subscription: function (subscriptionId, userId, active=true) {
	return new Promise((resolve, reject) => {
	    let sql = `UPDATE subscription SET active=? WHERE id=? AND userId=?;`
	    let values = [active, subscriptionId, userId];
	    
	    queryDB(sql, values, mysql)
	    	.then(res => {
		    console.log(`subscriptions modified - active = ${active},`
				+ ` affectedRow = ${res.affectedRows}`);
		    resolve(res);
		})
		.catch(err => console.log(err))
	});
    },
    /* name: get_user_template
       preconditions: userId is valid logged in user id
                      templateId is valid template id, which probably came from 
		        subscription page when user selected from template dropdown
       postconditions:  return Promise that returns user template when fulfilled
    */
    get_user_template: function (userId, templateId) {
	return new Promise((resolve, reject) => {
	    const sql = `SELECT name, file, uploaded FROM template `
	    + ` WHERE (id=? AND userId=?)`;
	    const values = [templateId, userId];

	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	});
    },
    /*******************************************************************/
    /****************** END SUBSCRIPTION PAGE QUERIES ******************/
    /*******************************************************************/

    /*******************************************************************/
    /******************** UNSUBSCRIBETOK PAGE QUERIES ******************/
    /*******************************************************************/
    get_number_user_redundant_subscriptions: function(userId, postId, post, country){
	return new Promise((resolve, reject) => {
	    const sql = `SELECT COUNT(u.id) AS numberSubscriptions`
		  + ` FROM user u`
		  + ` INNER JOIN subscription s ON u.id=s.userId`
		  + ` INNER JOIN COLARates_subscription crs ON s.id=crs.subscriptionId`
		  + ` INNER JOIN COLARates cr ON crs.COLARatesId=cr.id`
		  + ` WHERE (u.id=? AND cr.id=? AND s.active=1) || (u.id=? AND cr.post=? AND cr.country=? AND s.active=1)`;
	    const values = [userId, postId, userId, post, country];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res[0]))
		.catch(err => console.log(err))	    
	});
    },
    /*******************************************************************/
    /****************** END UNSUBSCRIBETOK PAGE QUERIES ****************/
    /*******************************************************************/
    
    /*******************************************************************/
    /*********************** ACCOUNT PAGE QUERIES **********************/
    /*******************************************************************/
    get_user_from_id: function(userId){
	return new Promise((resolve, reject) => {
	    const sql = `SELECT email, password, created, modified`
		  + ` FROM user WHERE id=?`;
	    const values = [userId];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res[0]))
		.catch(err => console.log(err))	    
	});
    },
	
	get_user_from_email: function(email){
	return new Promise((resolve, reject) => {
	    const sql = `SELECT id`
		  + ` FROM user WHERE email=?`;
	    const values = [email];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res[0]))
		.catch(err => console.log(err))	    
	});
    },
	
    update_user_password: function(userId, hashedPwd){
	return new Promise((resolve, reject) => {
	    const sql = `UPDATE user SET password=? WHERE id=?`;
	    const values = [hashedPwd, userId];
		console.log(values);
	    queryDB(sql, values, mysql)
		.then(res => {
		    if(res.affectedRows == 1) resolve();
		    else reject();
		})
		.catch(err => reject(err));
	    
	})
    }
    
    /*******************************************************************/
    /********************** END ACCOUNT PAGE QUERIES *******************/
    /*******************************************************************/
    
}

passport.serializeUser(function (user_id, done) {
    done(null, user_id);
});


passport.deserializeUser(function (user_id, done) {
    done(null, user_id);
});


passport.use(new LocalStrategy(function(username, password, done) {
    console.log('passport.use new localstrategy');
    var sql="SELECT id, password FROM user WHERE email=?"
    values = [username]
    queryDB(sql, values, mysql)
	.then(message => {
	    if (message.length == 0){
		console.log("wrong keyword entry");
		return done(null, false)
	    }
	    const hash = message[0].password.toString();
	    bcrypt.compare(password, hash, function(err, response){
		if (response == true){
		    return done(null, {user_id: message[0].id});
		}
		else{
		    return done(null, false);
		}
	    });
	})
	.catch(err => {
	    
	})
    
    
}));
