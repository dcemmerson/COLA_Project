var bcrypt = require('bcrypt');
const saltRounds = 10;

var mysql = require('../dbcon.js');
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
	
	/* place db functions here - see example below */
	/* addUser
	* takes email password, date as parameters
	*  and inserts a new user into the DB with hashed password
	*/	
	add_user: function (email, pwd, now, res) {
		bcrypt.hash(pwd, saltRounds, function (err, hash) {
			var sql = "INSERT INTO users (`email`, `password`, `created`, `modified`) VALUES (?, ?, ?, ?)"
			var values = [email, hash, now, now];
			queryDB(sql, values, mysql)
			
		});	
	}


}