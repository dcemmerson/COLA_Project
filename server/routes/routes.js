module.exports = function(app){
    /* This query is for testing purposes */
    

    app.get(`/login`, function(req,res) {
	res.render('login');
    });    
    app.get(`/subscriptions`, function(req,res) {
	res.render('profile')
    });
	
	app.get(`/create_account`, function (req, res) {
	res.render('create')
	});
	
	const addUser = (email, pwd, now) =>
	{
		var sql = "INSERT INTO users (`email`, `password`, `created`, `modified`) VALUES (?, ?, ?, ?)"
		//const now = new Date().toISOString().replace(/\..+/, '');
		var inserts = [req.body.email, req.body.pwd, now, now];
		mysql.pool.query(sql, inserts, function (error, result) {
			if (error) {
				console.log("error");
				throw error;
				return;
			}
			res.redirect('subscriptions');
			return;
		});
	}
	
	module.exports.addUser=addUser;
	
}
