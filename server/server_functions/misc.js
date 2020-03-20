const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'add_pw_to_dotenv';

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
    }
}
