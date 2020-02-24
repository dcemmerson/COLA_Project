let db = require('./db_functions.js');
module.exports = function(app,mysql){
    /* place ajax routes here */
    app.get(`/test`, function(req,res) {
	db.test_method(res, mysql)
	    .then(() => {
		res.render('login');
	    })
	    .catch(err => {
		console.log(err);
		res.end();
	    })
    });
}
