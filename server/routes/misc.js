module.exports = {
    /* place db functions here - see example below */
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
	}
	

}