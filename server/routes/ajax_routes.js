const db = require('../server_functions/db_functions.js');
const misc = require('../server_functions/misc.js');
const crs = require('../server_functions/cola_rates_script.js');

/********************* MARKED FOR REMOVAL *******************/
let after_load = require('after-load');

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

    /********************* MARKED FOR REMOVAL *******************/
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
	    db.add_cola_rates(scraped)
		.then(() => res.end())
		.catch(err => {
		    console.log(err);
		    res.end();
		})
	});
    });
    /********************* MARKED FOR REMOVAL *******************/
    /* name: UPDATE_cola_rates
       preconditions: None
       postconditions: parsed cola rates webpage, https://aoprals.state.gov/Web920/cola.asp,
                       and db has been updated with new rates.
       description: This routes was created simply to develop and test a script
       to UPDATE cola rates webpage, followed by processing the data obtained. This
       route will be removed in near future.
    */
    app.get(`/UPDATE_cola_rates`, (req, res) => {
	let changed_rates = [];
	after_load('https://aoprals.state.gov/Web920/cola.asp', html => {
	    const scraped = crs.parse_cola_page(html);
	    crs.check_rate_changes(scraped, changed_rates)
		.then(() => {
		    crs.update_changed_rates(changed_rates)
			.then(() => {
			    console.log('COLA rates updated: ' + new Date());
			    res.end();
			})
		})
		.catch(err => {
		    console.log(err)
		    res.end()
		})
	});
    });
    app.get('/get_user_subscription_list', /*db.authenticationMiddleware(),*/
	    function (req, res) {
		const temp_user_id = 1;
		let await_promises = [];
		let context = {subscription_list: []};
    		await_promises.push(
		    db.get_user_subscription_list(temp_user_id)
			.then(subs => subs.forEach(sub => {
			    context.subscription_list.push(sub);
			}))
			.catch(err => console.log(err))
		);
		Promise.all(await_promises)
		    .then(() => res.send(context))
	    });

}


