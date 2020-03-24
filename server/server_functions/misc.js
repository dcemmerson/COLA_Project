const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'add_pw_to_dotenv';
const Magic = require('mmmagic').Magic;

//max file upload size set to 2MB. Note mysql medium blob data type allows up to
//16MB blob size, but that seems a bit excessive and unnecessary.
const MAX_FILE_SIZE = 4000000; 
const BYTES_PER_MEGABYTE = 1000000;

module.exports = {
    add_user: function(email, pwd, now, res){
	var sql = "INSERT INTO users (`email`, `password`, `created`, `modified`) VALUES (?, ?, ?, ?)"
	//const now = new Date().toISOString().replace(/\..+/, '');
	var inserts = [email, pwd, now, now];
	mysql.pool.query(sql, inserts, function (error, result) {
	    if (error) {
		console.log("error");
		throw error;
		return;
	    }
	    
	});
    },
    jwt_verify: function(tok){
	return new Promise((resolve, reject) => {
	    jwt.verify(tok, JWT_SECRET, (err, decoded) => {
		if(err){
		    reject(err);
		}
		resolve(decoded);
	    })
	});
    },
    jwt_sign: function(payload){
	return new Promise((resolve, reject) => {
	    jwt.sign(payload, JWT_SECRET, (err, token) => {
		if(err){
		    console.log(err);
		    reject(err);
		}
		resolve(token);
	    })	
	});
    },
    /* name: validate_file
       preconditions: file object from multer module that contains information about
                        file that user uploaded, in addition to the actual file
			Buffer
		      context is object in which we will set flags to pass back to
		        client in case that file is invalidated
       postconditions: 
*/
    validate_file: function(file, context){
	return new Promise((resolve, reject) => {
	    var magic = new Magic();

	    magic.detect(file.buffer, (err, result) => {
		if(err){
		    console.log(err);
		    reject(err);
		}
		result = result.toLowerCase();
		if(file.size > MAX_FILE_SIZE){
		    context.errorMessage = `File must be <`
			+ ` ${Math.floor(MAX_FILE_SIZE / BYTES_PER_MEGABYTE)} MB`;
		    reject(context.errorMessage);
		}
		else if(!result.match('microsoft') || !result.match('word')){
		    context.errorMessage = `Invalid file type: ${result.substring(0, 12)}`;
		    reject(result);
		}
		else resolve();
	    });
	});
    }
}
