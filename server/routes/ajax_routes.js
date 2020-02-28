const db = require('../server_functions/db_functions.js');
const misc = require('../server_functions/misc.js');
const crs = require('../server_functions/cola_rates_script.js');

let after_load = require('after-load')

module.exports = function(app,  mysql){
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
    
    /* name: GET_cola_rates
       preconditions: None
       postconditions: parsed cola rates webpage data sent to calling location
       description: This routes was created simply to develop and test a script
       to GET cola rates webpage, followed by processing the data obtained. This
       route will be removed in near future.
    */
    app.get(`/GET_cola_rates`, (req, res) => {
	var context = {};
	
	after_load('https://aoprals.state.gov/Web920/cola.asp', html => {
	    const scraped = crs.parse_cola_page(html);
	    db.add_rates(scraped)
		.then(() => res.end())
		.catch(err => {
		    console.log(err);
		    res.end();
		})
	});
    });
}


