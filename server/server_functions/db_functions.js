var passport = require('passport');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;

const saltRounds = 10;
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
    addUser: function (email, hashedPwd, context) {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO user (email, password, isVerified) VALUES (?, ?, ?)"
            const values = [email, hashedPwd, false];

            queryDB(sql, values, mysql)
                .then(res => {
                    if (res.affectedRows == 1) {
                        resolve(res);
                    }
                    else {
                        reject();
                    }
                })
                .catch(reject);

        });
    },

    /* name: checkIfUserExists
       preconditions: email is provided by client
                      context is reference to object
       postconditions: promise resolves if email does not exist in db, else rejects
                       flags set in context if promise rejects
     */
    checkIfUserExists: function (email, context) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM user WHERE email=?";
            const values = [email];

            queryDB(sql, values, mysql)
                .then(res => {
                    if (res.length > 0) {
                        context.userAlreadyExists = true;
                        context.invalidMessage = "Account already taken";
                        reject();
                    }
                    else {
                        resolve();
                    }
                })
                .catch(reject)
        });
    },

    insertUser: function (email, pwd, now, res, req) {
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

    /* name: checkEmail
       preconditions: email is user supplied email
                      context is object we will fill with response information
       postconditions: context has been filled with user informtation found by
                       seraching db, if user exists
       description: Search db for user supplied email. If email exists, fill context
                    object with user information and resolve. Else, if no email found
		    set context.error to true, and reject. 
     */
    checkEmail: function (email, context) {
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
    /* name: verifyEmail
       preconditions: email is user supplied email during successful create account process.
                      userId is user.id selected from db when creating account.
		      context is object where we will set flag indicating success for failure
       postconditions: user email has been verified in db and user can now successfully log in
       description: Update db isVerified boolean in user table for userId. Email should never
                    never actually be used in this method, but should be supplied in case
		    an unexpected error occurs, we can log the error more verbosely.
     */
    verifyEmail: function (userId, email, context) {
        var sql = "UPDATE user SET isVerified=? WHERE id=?"
        var values = [true, userId];
        return new Promise((resolve, reject) => {
            queryDB(sql, values, mysql)
                .then(result => {
                    if (result.affectedRows === 1) {
                        //success
                        context.verified = true;
                        resolve()
                    }
                    else {
                        context.verified = false;
                        reject();
                    }
                })
                .catch(err => {
                    context.verified = false;
                    reject(err);
                });
        })
    },

    /* name: getUserById
       preconditions: userId to search for in db
                      context is object we will fill with response information
       postconditions: context has been filled with user informtation found by
                       seraching db, if user exists
       description: Search db for id. If user exists, fill context
                    object with user information and resolve. Else, if no user found
		    set context.error to true, and reject. 
     */
    getUserById: function (userId, context) {
        var sql = "SELECT id, email, password, isVerified, modified FROM user WHERE id=?"
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
                        context.username = result[0].email;
                        context.modified = result[0].modified;
                        context.isVerified = result[0].isVerified;
                        resolve(result[0].password);
                    }
                })
                .catch(err => {
                    reject(err);
                });
        })
    },

    /* name: getUserByEmail
       preconditions: email string to search for in db
                      context is object we will fill with response information
       postconditions: context has been filled with user informtation found by
                       seraching db, if user exists
       description: Search db for email. If user exists, fill context
                    object with user information and resolve. Else, reject. 
    */
    getUserByEmail: function (email, context) {
        var sql = "SELECT id, email, password, isVerified, modified FROM user WHERE email=?"
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
                        context.isVerified = result[0].isVerified;
                        resolve(result[0].password);
                    }
                })
                .catch(err => {
                    reject(err);
                });
        })
    },

    /* name: updateUser
       preconditions: id matches userId in db
       postconditions: user.password is updated to hash(pwd) in db
     */
    updateUser: function (id, pwd) {
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
    /* name: addColaRates
       preconditions: scraped contains array of objects of the form 
       postconditions: returns Promise that doesnt resolve until all
       have been successfully added to db. 
       description: This function should only need to be called to 
       initialize db. All cola rates contained in scraped
       are inserted into db. If any inserts fail, error 
       message printed and function returns immediately.
    */
    addColaRates: function (scraped) {
        return new Promise((resolve, reject) => {
            let queries = [];
            const sql = `INSERT INTO COLARates (country, post, allowance, lastModified) VALUES (?, ?, ?, now())`
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
    /* name: addColaRate
       preconditions: scraped contains array of objects of the form 
       postconditions: returns Promise that doesnt resolve until all
       have been successfully added to db. 
       description: This function should only need to be called to 
       initialize db. All cola rates contained in scraped
       are inserted into db. If any inserts fail, error 
       message printed and function returns immediately.
    */
    addColaRate: function (country, post, allowance, effectiveDate) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO COLARates (country, post, allowance, effectiveDate, lastModified) VALUES (?, ?, ?, ?, now())`
            let values = [country, post, allowance, effectiveDate];
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
    /* name: getColaRate
       preconditions: country is string name of country which we need cola rate
       post is string name of post which we need cola rate
       postconditions: returns promise, which when resolved returns object with 
       id, country, post, and allowance as data members
    */
    getColaRate: function (country, post) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM COLARates WHERE country=? AND post=?`;
            const values = [country, post];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(err => console.log(err))
        })

    },
    /* name: updateColaRate
       preconditions: COLARateId is is of corresponding post/country needing update
                      newAllowance is new allowance obtained by scraping webpage
       postconditions: COLARate.id has been updated with newAllowance
    */
    updateColaRate: function (COLARateId, newAllowance, prevAllowance, effectiveDate) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE COLARates SET allowance=?, prevAllowance=?, effectiveDate=?, lastModified=NOW() WHERE id=?`
            const values = [newAllowance, prevAllowance, effectiveDate, COLARateId];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(reject)
        });
    },
    /* name: updateColaRateEffectiveDate
       preconditions: COLARateId is is of corresponding post/country needing update
                      effectiveDate is just that - we will update COLARate.effectiveDate
		        with effectiveDate
       postconditions: COLARate.id has been updated with effectiveDate
    */
    updateColaRateEffectiveDate: function (COLARateId, effectiveDate) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE COLARates SET effectiveDate=? WHERE id=?`
            const values = [effectiveDate, COLARateId];
            queryDB(sql, values, mysql)
                .then(resolve)
                .catch(reject)
        });
    },
    /* name: getUsersSubscribedToPost
       preconditions: post is name of post in db
       country is name of country that corresponds to post
       postconditions: return list of users subscribed to post, along with
       the template file for each user.
    */
    getUsersSubscribedToPost: function (postId) {
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
                .catch(reject)
        });
    },

    /*******************************************************************/
    /******************* END COLA RATE SCRIPT QUERIES *****************/
    /*******************************************************************/

    /*******************************************************************/
    /********************* USER INFO PAGE QUERIES **********************/
    /*******************************************************************/
    /* name: getAllUsersSubscriptions
       preconditions: None, per se. This method should only be used/
                      called by logged in users with admin privileges,
		      granted in user.isAdmin.
       postconditions:  return list of every user in db. Subscription
                          lists are selected for each user after rather
			  rather than joining table for simplicity
			  of constructing context object as follows:

			  context = [
			    {
			      email: email,
			      created: created,
			      subscriptions: [
			        {country: country, post: post}
			        ]
			      }
			  ]
			If db gets sufficiently large, this may need
			to change.
    */
    getAllUsersSubscriptions: function (context) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, email, created, isAdmin, isVerified FROM user ORDER BY email ASC';
	    const sql2 = 'SELECT u.email, u.isAdmin, u.isVerified, s.created, cr.country, cr.post'
		  + ' FROM user u'
		  + ' INNER JOIN subscription s ON u.id=s.userId'
		  + ' INNER JOIN COLARates_subscription crs ON s.id=crs.subscriptionId'
		  + ' INNER JOIN COLARates cr ON crs.COLARatesId=cr.id'
		  + ' WHERE s.userId=? AND s.active=true ORDER BY cr.country ASC, cr.post ASC'
	    
            queryDB(sql, [], mysql)
		.then(users => {
		    let awaitPromises = [];
		    users.forEach((user, ind) => {
			context.push(user);
			awaitPromises.push(
			    queryDB(sql2, [user.id], mysql)
				.then(sub => {
				    context[ind].subscription = sub;
				    context[ind].numberSubscriptions = sub.length;
				})
			);
			
		    })
		    return Promise.all(awaitPromises);
		})
                .then(resolve)
                .catch(reject)
        });
    },
    /*******************************************************************/
    /******************* END USER INFO PAGE QUERIES ********************/
    /*******************************************************************/
    
    /*******************************************************************/
    /********************* SUBSCRIPTION PAGE QUERIES *******************/
    /*******************************************************************/
    /* name: getListOfPosts
       preconditions: None 
       postconditions:  return Promise that returns list of posts when
       fulfilled
    */
    getListOfPosts: function () {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM COLARates ORDER BY country ASC, post ASC`;
            const values = [];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(reject)
        });
    },

    /* name: getUserSubscriptionList
       preconditions: userId is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns list of user's 
       subscription when fulfilled
    */
    getUserSubscriptionList: function (userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT cr.post, cr.country, cr.allowance, cr.prevAllowance, cr.effectiveDate,`
                + ` s.id AS subscriptionId, s.name, s.comment, t.id AS templateId`
                + ` FROM user u`
                + ` INNER JOIN subscription s ON u.id=s.userId`
                + ` INNER JOIN template t ON s.templateId=t.id`
                + ` INNER JOIN COLARates_subscription crs ON s.id=crs.subscriptionId`
                + ` INNER JOIN COLARates cr ON crs.COLARatesId=cr.id`
                + ` WHERE u.id=? AND s.active=1`
                + ` ORDER BY cr.country ASC, cr.post ASC`;
            const values = [userId];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(reject)
        });
    },

    /* name: getUserSubscriptionById
       preconditions: subscriptionId matches subscription we are querying
       postconditions:  return Promise that returns subscription match subscriptionId 
       subscription when fulfilled
    */
    getUserSubscriptionById: function (subscriptionId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT cr.post, cr.country, cr.allowance,`
                + ` cr.prevAllowance, cr.effectiveDate, cr.lastModified,`
                + ` s.id AS subscriptionId, s.name, s.comment, `
                + ` t.id as templateId`
                + ` FROM user u`
                + ` INNER JOIN subscription s ON u.id=s.userId`
                + ` INNER JOIN template t ON s.templateId=t.id`
                + ` INNER JOIN COLARates_subscription crs ON s.id=crs.subscriptionId`
                + ` INNER JOIN COLARates cr ON crs.COLARatesId=cr.id`
                + ` WHERE s.id=?`
                + ` ORDER BY cr.country ASC, cr.post ASC`;
            const values = [subscriptionId];
            queryDB(sql, values, mysql)
                .then(res => resolve(res[0]))
                .catch(reject)
        });
    },

    /* name: getUserTemplateNames
       preconditions: userId is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns names and ids of all user's
       uploaded templates, plus the default system template.
    */
    getUserTemplateNames: function (userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT t.id, t.name, t.comment`
                + ` FROM user u`
                + ` INNER JOIN template t ON u.id=t.userId`
                + ` WHERE u.id=? || t.id=?`
                + ` ORDER BY t.name ASC`;
            const values = [userId, DEFAULT_TEMPLATE_ID];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(reject)
        });
    },

    /* name: getUserEmail
       preconditions: userId is current logged in user, which should be
       obtained from open sesssion.
       postconditions:  return Promise that returns email that corresponds
       to user.id in user table.
    */
    getUserEmail: function (userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT email, isAdmin FROM user WHERE id=?`;
            const values = [userId];
            queryDB(sql, values, mysql)
                .then(res => resolve(res))
                .catch(reject)
        });
    },


    /* name: insertNewSubscriptionWithTemplateFile
       preconditions: userId should be id of logged in user.
                      name will be stored in name field - should match name of file
		      file is validated docx file template uploaded by user
		      comment is any comment the user added when uploading file.
       postconditions:  return Promise that fulfills after new subscription added
    */
    insertNewSubscriptionWithTemplateFile: function (userId, postId, filename, file, comment = "", context) {
        return new Promise((resolve, reject) => {
            let sql = `INSERT INTO template (name, file, comment, userId) VALUES (?, ?, ?, ?);`

            let values = [filename, file, comment, userId]
	    console.log(sql);
	    console.log(values);
            queryDB(sql, values, mysql)
                .then(res => {
                    sql = `INSERT INTO subscription (name, comment, userId, templateId, active) VALUES (?, ?, ?, ?, ?);`
                    values = ["", "", userId, res.insertId, 1];
                    context.templateId = res.insertId;
                    return queryDB(sql, values, mysql);
                })
                .then(res => {
                    sql = ` INSERT INTO COLARates_subscription (subscriptionId, COLARatesId) VALUES (?, ?);`
                    values = [res.insertId, postId];
                    context.subscriptionId = res.insertId;
                    return queryDB(sql, values, mysql);
                })
                .then(() => resolve())
                .catch(reject)
        });
    },

    /* name: insertNewSubscriptionWithPrevTemplate
       preconditions: userId should be id of logged in user.
                      comment is any comment the user added when uploading file.
		      templateId is id corresponding to primary key in template table
       postconditions:  return Promise that fulfills after new subscription added
    */
    insertNewSubscriptionWithPrevTemplate: function (userId, postId, templateId, comment = "", context) {
        return new Promise((resolve, reject) => {
            let sql = `INSERT INTO subscription (name, comment, userId, templateId, active) VALUES (?, ?, ?, ?, ?);`
            let values = ["", "", userId, templateId, 1];
            context.templateId = templateId;
            queryDB(sql, values, mysql)
                .then(res => {
                    sql = ` INSERT INTO COLARates_subscription (subscriptionId, COLARatesId) VALUES (?, ?);`
                    values = [res.insertId, postId];
                    context.subscriptionId = res.insertId;
                    return queryDB(sql, values, mysql);
                })
                .then(() => resolve())
                .catch(reject)
        });
    },

    /* name: updateUserSubscription
       preconditions: userId should be id of logged in user.
                      subscriptionId is id corresponding to primary key in subscription table
		      that user wishes to delete
		      active should be set to 1 or true if we want to reactive a subscription, 0 or false if
		      we need to deactive/delete subscription
       postconditions:  return Promise that fulfills after subscription active field updated
    */
    updateUserSubscription: function (subscriptionId, userId, active = true) {
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
    
    /* name: getUserTemplate
       preconditions: userId is valid logged in userId
                      templateId is valid template id, which probably came from 
		        subscription page when user selected from template dropdown
       postconditions:  return Promise that returns user template when fulfilled.
                        Additionally, method performs join user to get username, in
			case error thrown when manip template, we can log more info
			about what went wrong.
    */
    getUserTemplate: function (userId, templateId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT u.email, t.name, t.file, t.uploaded FROM template t`
                + ` INNER JOIN user u on t.userId=u.id`
                + ` WHERE (t.id=? AND userId=?)`;
            const values = [templateId, userId];
            queryDB(sql, values, mysql)
                .then(resolve)
                .catch(reject)
        });
    },
    
    /*******************************************************************/
    /****************** END SUBSCRIPTION PAGE QUERIES ******************/
    /*******************************************************************/

    /*******************************************************************/
    /******************** UNSUBSCRIBETOK PAGE QUERIES ******************/
    /*******************************************************************/

    /* name: getNumberUserRedundantSubscriptions
       preconditions: userId corresponds to user.id in db
                      postId, post, country all correspond to post which we are querying
       postconditions: count number of subscriptions userId has to post
       description: Method performs table joins to determine how many subscriptions
                      userId has to given post. We will match posts/country OR
		      postId and count the results.
     */    
    getNumberUserRedundantSubscriptions: function (userId, postId, post, country) {
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
                .catch(reject)
        });
    },
    
    /*******************************************************************/
    /****************** END UNSUBSCRIBETOK PAGE QUERIES ****************/
    /*******************************************************************/

    /*******************************************************************/
    /*********************** ACCOUNT PAGE QUERIES **********************/
    /*******************************************************************/
   /* name: getUserFromId
       preconditions: userId corresponds to user.id in db
       postconditions: resolve with user corresponding to userId
   */
    getUserFromId: function (userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT email, password, created, modified`
                + ` FROM user WHERE id=?`;
            const values = [userId];
            queryDB(sql, values, mysql)
                .then(res => resolve(res[0]))
                .catch(reject)
        });
    },

    /* name: getUserFromEmail
       preconditions: userId corresponds to user.id in db
       postconditions: resolve with user corresponding to email
   */
    getUserFromEmail: function (email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id`
                + ` FROM user WHERE email=?`;
            const values = [email];
            queryDB(sql, values, mysql)
                .then(res => resolve(res[0]))
                .catch(reject)
        });
    },

    /* name: updateUserPassword
       preconditions: userId corresponds to user.id in db
                      hashedPwd is hashed password entered by user
		        which we will update for user.id row.
       postconditions: resolve once user password updated.
   */
    updateUserPassword: function (userId, hashedPwd) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE user SET password=? WHERE id=?`;
            const values = [hashedPwd, userId];
            console.log(values);
            queryDB(sql, values, mysql)
                .then(res => {
                    if (res.affectedRows == 1) resolve();
                    else reject();
                })
                .catch(reject);

        })
    },

    /*******************************************************************/
    /********************** END ACCOUNT PAGE QUERIES *******************/
    /*******************************************************************/

    /*******************************************************************/
    /********************** SET PREV ALLOWANCE QUERIES *****************/
    /*******************************************************************/
/*
    get_prev_allowances_99: function () {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM COLARates WHERE prevAllowance=?`;
            const values = [-99];
            queryDB(sql, values, mysql)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(err));

        })
    },
    get_prev_allowances_99_no_effective: function () {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM COLARates WHERE prevAllowance=? AND effectiveDate=?`;
            const values = [-99, "2020-05-11 10:50:13"];
            queryDB(sql, values, mysql)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(err));

        })
    },
    set_prev_allowance: function (postId, prevAllowance, modifiedDate) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE COLARates SET prevAllowance=?, lastModified=? WHERE id=?`;
            const values = [prevAllowance, modifiedDate, postId];
            queryDB(sql, values, mysql)
                .then(res => {
                    console.log("postId = " + postId + " updated to prevAllowance = " + prevAllowance);
                    resolve(res);
                })
                .catch(reject);

        })
    }
*/
    /*******************************************************************/
    /********************** END PREV ALLOWANCE QUERIES *******************/
    /*******************************************************************/

}

passport.serializeUser(function (userId, done) {
    done(null, userId);
});


passport.deserializeUser(function (userId, done) {
    done(null, userId);
});


passport.use(new LocalStrategy(function (username, password, done) {
    var sql = "SELECT id, isVerified, password FROM user WHERE email=?";
    values = [username];

    queryDB(sql, values, mysql)
        .then(message => {
            if (message.length == 0) {
                console.log("wrong keyword entry");
                return done(null, false)
            }
            else if (!message[0].isVerified) {
                console.log(`${username} needs to be verified`);
                return done(null, false);
            }

            const hash = message[0].password.toString();
            bcrypt.compare(password, hash, function (err, response) {
                if (response == true) {
                    return done(null, { userId: message[0].id });
                }
                else {
                    return done(null, false);
                }
            });
        })
        .catch(err => {
            console.log(err);
        })


}));
