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
}
