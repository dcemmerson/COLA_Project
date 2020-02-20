/* name: queryDB
   preconditions: sql contains string sql query
                  values is array of arguments for sql statement
		  mysql is connection to db
   postconditions: returns Promise. Upon successful execution of sql statement
                   Promise resolves with results, else rejects with error message.
   description: queryDB is a helper function for querying database.
*/
function queryDB(sql,values,mysql){
    return new Promise((resolve,reject) => {
	mysql.pool.query(sql,values,(err,results,fields) => {
	    if(err){
		console.log('db query rejecting');
		reject(err);
	    }
		else resolve(results);
	});
    });
}

module.exports = {
    /* place db functions here - see example below */
    getHighScores: function(res,mysql,start,packetSize){
	return new Promise((resolve,reject) => {
	    const sql = `SELECT username,score,level,rowsCleared FROM scores ORDER BY score DESC LIMIT ?,?`;
	    const values = [start,packetSize];
	    queryDB(sql,values,mysql)
		.then((results) => {
		    console.log(results);
		    if(results.length > 0) resolve(results);
		    else reject()
		})
		.catch(err => reject(err))
	})
    },
}
