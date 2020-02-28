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
    },

    /* name: add_rates
       preconditions: scraped contains array of objects of the form 
       postconditions: returns Promise that doesnt resolve until all
                       have been successfully added to db. 
       description: This function should only need to be called to 
                    initialize db. All cola rates contained in scraped
		    are inserted into db. If any inserts fail, error 
		    message printed and function returns immediately.
     */
    add_rates: function(scraped){
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
    /* name: get_cola_rate
       preconditions: country is string name of country which we need cola rate
                      post is string name of post which we need cola rate
       postconditions: returns promise, which when resolved returns object with 
                       id, country, post, and allowance as data members
       description:
     */
    get_cola_rate: function(country, post){
	return new Promise((resolve, reject) => {
	    const sql = `SELECT * FROM COLARates WHERE country=? AND post=?`
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
    update_cola_rate: function(COLARate_id, new_allowance){
	return new Promise((resolve, reject) => {
	    const sql = `UPDATE COLARates SET allowance=? WHERE id=?`
	    const values = [new_allowance, COLARate_id];
	    queryDB(sql, values, mysql)
		.then(res => resolve(res))
		.catch(err => console.log(err))
	})
	
    }
    
}
