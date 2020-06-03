var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'add_pw_to_dotenv';
const Magic = require('mmmagic').Magic;
const db = require('./db_functions.js');
const tm = require('../server_functions/template_manip.js');

//max file upload size set to 4MB. Note mysql medium blob data type allows up to
//16MB blob size, but that seems a bit excessive and unnecessary.
const MAX_FILE_SIZE = 4000000;
const BYTES_PER_MEGABYTE = 1000000;
const SALT_ROUNDS = 10;

module.exports = {

    /* name: jwtVerify
       preconditions: tok is signed using jwtSign
                      jwtSecret must be same jwtSecret that was used to
		        sign this tok
       postconditions: If decoding tok was successful, resolve with
                         decoded object, else reject with error.
    */
    jwtVerify: function (tok, jwtSecret = JWT_SECRET) {
        return new Promise((resolve, reject) => {
            jwt.verify(tok, jwtSecret, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded);
            })
        });
    },

    /* name: jwtSign
       preconditions: tok is signed using jwtSign
                      jwtSecret used to sign token
		      expiresIn is not required. If present, expiresIn should
		        be max life for this token. If not present, token 
			never expires.
       postconditions: If signing tok was successful, resolve with
                         encoded token, else reject with error.
    */
    jwtSign: function (payload, jwtSecret = JWT_SECRET, expiresIn) {
        if (expiresIn) {
            return new Promise((resolve, reject) => {
                jwt.sign(payload, jwtSecret,
                    { expiresIn: expiresIn }, (err, token) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        console.log('resolving sign');
                        resolve(token);
                    })
            });
        }
        else {
            return new Promise((resolve, reject) => {
                jwt.sign(payload, jwtSecret, (err, token) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(token);
                })
            });
        }
    },
    
    /* name: validateFile
       preconditions: file object from multer module that contains information about
                        file that user uploaded, in addition to the actual file
			Buffer
		      context is object in which we will set flags to pass back to
		        client in case that file is invalidated
       postconditions: check if file is actually .doc or .docx using Magic module.
                       Resolve if valid file type, else reject.
    */
    validateFile: function (file, context) {
        return new Promise((resolve, reject) => {
            var magic = new Magic();

            magic.detect(file.buffer, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                result = result.toLowerCase();
                if (file.size > MAX_FILE_SIZE) {
                    context.errorMessage = `File must be <`
                        + ` ${Math.floor(MAX_FILE_SIZE / BYTES_PER_MEGABYTE)} MB`;
                    reject(context.errorMessage);
                }
                else if (!result.match('microsoft') || (!result.match('word') && !result.match('ooxml'))) {
                    context.errorMessage = `Invalid file type: ${result.substring(0, 12)}`;
                    reject(result);
                }
                else resolve();
            });
        });
    },

    /* name: validatePassword
       preconditions: userId is user id whose credentials we are checking 
                      oldPwd will be checked against db
                      newPwd is pwd that user desires to change to
		      newPwdRe is re-entered pwd by user
		      context is object in which we will set flags to pass back to
		        client in case that pwd is invalidated
       postconditions: oldPwd has been checked against db
                       newPwd has been checked to be at least 8 char, contain 1+
		         lower case, 1+ upper case, 1+ num, 1+ non-alphanumeric
		       context has been set with flags indicating success/failure
       description: upon successful password validation, resolve method is called.
                      else reject method is called
    */
    validatePassword: function (userId, oldPwd, newPwd, newPwdRe, context) {
        return new Promise((resolve, reject) => {
            let lowerCase = /[a-z]/g;
            let upperCase = /[A-Z]/g;
            let numbers = /[0-9]/g;
            let minLength = 8;
            let validPassword = false;
            let special = /\W|_/g

            //check for lower case letters in password
            if (!newPwd.match(lowerCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more lower case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(upperCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more upper case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(numbers)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one number';
            }
            else if (!newPwd.match(special)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one special'
                    + ' character (eg ^!@#$%^&*+=._-+)';
            }
            else if (newPwd.length < minLength) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least 8 characters';
            }
            else if (newPwd !== newPwdRe) {
                context.invalidNewPasswordRe = true;
                context.invalidMessage = 'Password mismatch';
            }
            else {
                //then the new pwd is valid. now check if user entered prev password correctly
                db.getUserFromId(userId)
                    .then(res => comparePassword(oldPwd, res.password))
                    .then(compRes => {
                        if (compRes) {
                            if (oldPwd != newPwd)//change password
                                resolve();
                            else {
                                context.invalidNewPassword = true;
                                context.invalidMessage = 'New password must be different from previous';
                                reject();
                            }
                        }
                        else {
                            context.invalidOldPassword = true;
                            context.invalidMessage = "Incorrect password";
                            reject();
                        }
                    })
                    .catch(err => {
                        context.error = err
                        reject(err);
                    })
            }
            //If we get to this point, user entered invalid newPwd/newPwdRe
            //We can just reject without an error
            if (context.invalidNewPassword || context.invalidNewPasswordRe) reject();
        })
    },
    
    /* name validatePasswordReset
       preconditions: userId is user id whose credentials we are checking 
                      oldPwdEnc is old password will be checked to make sure
		           its not same as new password
                      newPwd is pwd that user desires to change to
		      newPwdRe is re-entered pwd by user
		      context is object in which we will set flags to pass back to
		        client in case that pwd is invalidated
       postconditions: oldPwd has been compared to new password
                       newPwd has been checked to be at least 8 char, contain 1+
		         lower case, 1+ upper case, 1+ num, 1+ non-alphanumeric
		       context has been set with flags indicating success/failure
       description: upon successful password validation, resolve method is called.
                      else reject method is called
     */
    validatePasswordReset: function (userId, oldPwdEnc, newPwd, newPwdRe, context) {
        return new Promise((resolve, reject) => {
            let lowerCase = /[a-z]/g;
            let upperCase = /[A-Z]/g;
            let numbers = /[0-9]/g;
            let minLength = 8;
            let validPassword = false;
            let special = /\W|_/g

            //check for lower case letters in password
            if (!newPwd.match(lowerCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more lower case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(upperCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more upper case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(numbers)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one number';
            }
            else if (!newPwd.match(special)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one special'
                    + ' character (eg ^!@#$%^&*+=._-+)';
            }
            else if (newPwd.length < minLength) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least 8 characters';
            }
            else if (newPwd !== newPwdRe) {
                context.invalidNewPasswordRe = true;
                context.invalidMessage = 'Password mismatch';
            }
            else {
                //then the new pwd is valid. now check if user entered prev password correctly
                comparePassword(newPwd, oldPwdEnc)
                    .then(compRes => {
                        if (!compRes) { //new pwd entered is valid and different than old pwd
                            resolve();
                        }
                        else {
                            context.invalidNewPassword = true;
                            context.invalidMessage = 'New password must be different from previous';
                            reject();
                        }
                    })
                    .catch(err => {
                        context.error = "An error seems to have occurred";
                        reject(err);
                    })
            }
            //If we get to this point, user entered invalid newPwd/newPwdRe
            //We can just reject without an error
            if (context.invalidNewPassword || context.invalidNewPasswordRe) reject();
        })
    },

    /* name: validatePasswordNewAccount
       preconditions: newPwd and newPwdRe were provided by client
                      context is empty object
       postconditions: newPwd has been checked to be at least 8 char, contain 1+
		       lower case, 1+ upper case, 1+ num, 1+ non-alphanumeric
		       newPwd checked to match newPwdRe
		       context has been set with flags indicating success/failure
       description: upon successful password validation, resolve method is called.
                      else reject method is called
     */
    validatePasswordNewAccount: function (newPwd, newPwdRe, context) {
        return new Promise((resolve, reject) => {
            let lowerCase = /[a-z]/g;
            let upperCase = /[A-Z]/g;
            let numbers = /[0-9]/g;
            let minLength = 8;
            let validPassword = false;
            let special = /\W|_/g

            //check for lower case letters in password
            if (!newPwd.match(lowerCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more lower case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(upperCase)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain one or more upper case characters';
            }
            //check for upper case letters in password
            else if (!newPwd.match(numbers)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one number';
            }
            else if (!newPwd.match(special)) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least one special'
                    + ' character (eg ^!@#$%^&*+=._-+)';
            }
            else if (newPwd.length < minLength) {
                context.invalidNewPassword = true;
                context.invalidMessage = 'Must contain at least 8 characters';
            }
            else if (newPwd !== newPwdRe) {
                context.invalidNewPasswordRe = true;
                context.invalidMessage = 'Password mismatch';
            }
            else {
                //then the new pwd is valid
                return resolve()
            }
	    
            // If we get to this point, an if/elseif executve and
	    // user entered invalid newPwd/newPwdRe
            // We can just reject without an error
            return reject();
        })
    },

    /* name: validateEmail
       preconditions: email is provided by client
                      context is object reference where we will set any error flags
       postconditions: regular expression used to determine if client provided
                       email conforms to email format.
		       context has been set with any error flags.
       description: Returns a promise (to make this method then-able) which resolves
                    if valid email provided, else rejects and sets flags in context
		       
    */
    validateEmail: function (email, context) {
        return new Promise((resolve, reject) => {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (!re.test(String(email).toLowerCase())) {
                context.invalidEmail = true;
                context.invalidMessage = "Invalid email";
                reject();
            }
            else if (email.length > 254) {
                reject();
            }
            else {
                resolve();
            }
        })
    },

    /* name: previewTemplate
       preconditions: userId is obtained from authentication system - logged in user
                      context is object reference where we will set any error flags
		        and well as place the filled in template pdf.
       postconditions: context contains file attributes and filled in pdf preview.
       description: Method used to select subscription template from db and fill
                      the values in doc/docx file containing {} fields. We then
		      convert doc/docx to pdf and return to calling location.
		      context then contains object with file attributes and
		      filled in pdf preview of file. This would typically be
		      sent back to client and the user would be shown a preview
		      of the document.
    */
    previewTemplate: function (userId, templateId, context, fillValues) {
        return new Promise((resolve, reject) => {
            db.getUserTemplate(userId, templateId)
                .then(response => {
                    if (!response[0]) {
                        throw (new Error(`Error: template does not exist`
                            + ` (userId=${userId},`
                            + ` templateId=${templateId})`));
                    }

                    context.filename = response[0].name;
                    context.uploaded = response[0].uploaded;
                    if (fillValues) {
                        return db.getColaRate(fillValues.country, fillValues.post)
                            .then(postInfo => {
				context.country = fillValues.country;
				context.post = fillValues.post;
                                context.file = response[0].file;
                                context.username = response[0].email;
                                context.file = tm.manipTemplate(context, postInfo[0]);

                                return tm.docxToPdf(context.file);
                            })
                    }
                    else {
                        return tm.docxToPdf(response[0].file);
                    }
                })
                .then(pdfBuf => {
                    context.file = pdfBuf;
                    resolve();
                })
                .catch(err => {
                    if (err) console.log(err);
                    reject();
                })
        })
    },
    
    /* name: hashPassword
       preconditions: pwd is plain text password
       postconditions: resolve with bcrypt hashed password
     */
    hashPassword: function (pwd) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(pwd, SALT_ROUNDS, (err, hash) => {
                console.log(hash);
                if (err) reject(err);
                else resolve(hash);
            })
        })
    },
    
    /* name: setLayout
       preconditions: req is incoming user request
       context is object
       posconditions: set context.layout, context.loggedIn, context.email
       accordingly if user is logged in.
    */
    setLayout: function (req, context) {
        return new Promise((resolve, reject) => {

	    checkBrowserCompatibility(req.useragent, context);
	    
            if (req.isAuthenticated()) {
                context.layout = 'main.hbs';
                context.loggedIn = true;

                db.getUserEmail(req.session.passport.user.userId)
                    .then(res => {
                        context.email = res[0].email;
			context.isAdmin = res[0].isAdmin;
                        resolve();
                    })
                    .catch(err => {
                        console.log(err)
                        reject();
                    })
            }
            else {
                context.layout = 'landingLayout.hbs';
                context.loggedIn = false;
                resolve();
            }
        });
    },

    /* name: loginHelper
       preconditions: passport is passport module
                      req is incoming client request
		      res comes from incoming request
		      next must be function we want called if login succeeds
		      context is object we will fill with flags indicating outcome
		        Potential flags include context.error, context.invalid,
			context.success.
       postconditions: If valid login request provided by clinet, user is logged in.
                       context.redirect = '/subscriptions' along with context.success
		       indicates to client to follow redirect.
    */
    loginHelper: function (passport, req, res, next, context) {
        return new Promise((resolve, reject) => {
            passport.authenticate('local', function (err, user, info) {
                if (err) {
                    context.error = true;
                    return reject(err);
                }
                else if (!user) {
		    console.log(info);
		    console.log(user);
		    if (!info.isVerified){
			context.unverifiedEmail = req.body.username;
			context.invalid = true;
			context.isVerified = false;
			return reject();
		    }
		    else {
			context.invalid = true;
			context.isVerified = true; 
			return reject();
		    }
                }

                req.logIn(user, function (err) {
                    if (err) {
                        context.error = true;
                        return reject(err);
                    }
                    context.success = true;
                    context.redirect = '/subscriptions';
                    return resolve();
                });
            })(req, res, next)
        })

    },

    /* name: toHumanDate
       preconditions: date is an instance of datetime
       postconditions: return date in string format "Day Month Year" 
     */
    toHumanDate: function(date) {
	let month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);

	return date.getDate() + ' '+ month + ' ' + date.getFullYear();
    },
}

/* name: comparePassword
   preconditions: pwd is plain text password, probably supplied by user
                  hashed is hashed password (probably supplied by user.password
		    field in db) for which we want to test if pwd matches the
		    hashed version
   postconditons: resolve if pwd and hashed are equivalent, else reject.
*/
function comparePassword(pwd, hashed) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(pwd, hashed, (err, result) => {
	    if (err) reject(err);
	    else resolve(result);
        })
    })
}

/* name: checkBrowserCompatibility
   preconditions: context is object. context.scripts should have been set
                    with arr of script used on browser before calling this.
                  useragent is obtained from express useragent.
   postconditions: context.incompatibleBrowser is set to true/false.
                   Each element has been prepended with es5/ if incompatible
		     browser is used.
   description: Minimum recommended browser versions for cola.govapps.us
                  are Chrome 61+, Firefox 58+, Safari 11+, but preferably
		  newer than those. Versions found in .env file.
*/
function checkBrowserCompatibility(useragent, context) {
    if(useragent.browser === "Chrome" && process.env.CHROME_VERSION) {
	context.incompatibleBrowser = false;
    }
    else if(useragent.browser === "Firefox" && process.env.FIREFOX_VERSION) {
	context.incompatibleBrowser = false;
    }
    else if(useragent.browser === "Safari"
	    && parseInt(useragent.version) >= process.env.SAFARI_VERSION) {
	context.incompatibleBrowser = false;
    }
    else {
	context.incompatibleBrowser = true;
    }

    if(context.incompatibleBrowser){
	useES5Scripts(context.script);
    }
}

/* name: useES5Scripts
   preconditions: scripts is arr of js script names that will be sent to
                    client.
   postconditions: Each script has been prepended with es5/
*/
function useES5Scripts(scripts) {
    scripts.forEach((script, ind) => {
	scripts[i] = script.replace(/^/, 'es5/');
    });
}
