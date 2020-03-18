const db = require('./db_functions.js');
const set_interval = require('set-interval');
const after_load = require('after-load');
const emails = require('./emails.js');


module.exports = {
    /******************* MARKED FOR REMOVAL ********************/
    /* name: parse_cola_page
       preconditions: html is passed as string containing html page
                      in which any js for that page has already made
		      any necessary changes on that page, as interpreted
		      by after-load
       postconditions: return array of objects containing country, post
                       and post_allowance for all posts on
		       https://aoprals.state.gov/Web920/cola.asp
       description: parse_cola_page takes in the html string from cola
                    webpage as argument, then uses cherio module to
		    use jquery-like method calls on html page. Country,
		    post, and post_allowance are then scraped from each
		    row, stored in an object, and pushed into array
		    that is returned from this method.
     */
    parse_cola_page: function(html){
	const cherio = require('cherio');
	var context = [];
	const $ = cherio.load(html);
	
	$('.web920_left tr').each((index, tr) => {
	    const country = $(tr)
		  .find('td[title="Country Name"]')
		  .find('a').text();
	    const post = $(tr)
		  .find('td[title="Post Name"]')
		  .text();
	    const post_allowance = $(tr)
		  .find('td[title="Post Allowance"]')
		  .text();
	    if(country != '')
		context.push({
		    country: country,
		    post: post,
		    allowance: post_allowance.slice(0, post_allowance.search(/%/))
		});
	})
	return context;
    },

    /****************** MARKED FOR REMOVAL ******************/
    /* name: check_rate_changes
       preconditions: scraped_rates contains array of objects obtained by scraping
                      of the form {country:country, post: post, allowance: allowance}
		      changed_rates is empty array
       postconditions: If any rates have changed since last checked, changed_rates contains
                       information about each post and new allowance. Returns a promise
		       that does not resolve until all db queries have been completed.
       description: Take each element in scraped_rates obtained from scraping
                    from https://aoprals.state.gov/Web920/cola.asp webpage, select the 
		    corresponding element/post in db and compare previous allowance to
		    newly scraped allowance. If allowance is different, add to changed_rates
		    array.
     */
/*    check_rate_changes: function(scraped_rates, changed_rates){
	let queries = []; 
	
	scraped_rates.forEach(element => {
	    let query = db.get_cola_rate(element.country, element.post)
		.then(res => {
		    if(res[0].allowance != element.allowance){
			changed_rates.push({
			    id: res[0].id,
			    country: res[0].country,
			    post: res[0].post,
			    allowance: element.allowance,
			    previously_last_modified: res[0].last_modified
			});
		    }
		})
		.catch(err => {
		    console.log(err);
		    reject(err);
		})
	    queries.push(query);
	});

	return new Promise((resolve, reject) => {
	    Promise.all(queries).then(() =>{
		resolve();
	    });
	})
    },
  */  
    /****************** MARKED FOR REMOVAL ******************/
    /* name: update_changed_rates
       preconditions: changed_rates is array of objects for each post that has changed and
                      needs to be UPDATed in db
       postconditions: All posts described in changed_rates hae been changed.
                       Returns a promise that doesnt resolve until all queries have
		       been completed.
       description: UPDATE each row allowance in db corresponding to changed_rates[].id
    */
/*    update_changed_rates: function(changed_rates){
	let queries = [];
	
	changed_rates.forEach(changed => {
	    let query = db.update_cola_rate(changed.id, changed.allowance)
		.catch(err => {
		    console.log(err);
			reject(err);
		})
	    queries.push(query);
	});
	
	return new Promise((resolve, reject) => {
	    Promise.all(queries).then(() =>{
		resolve();
	    });
	})
    },
*/
    /* name: schedule_crcs
       preconditions: None
       postconditions: cola rate change script has been scheduled to run
                       at 00:00:00 GMT. start_cola_rate_change_script has
		       been called and will continue to run script every
		       24 hours.
       description: function needs to be called just once at node server startup. Function
                    schedules for script to start at midnihgt, and then reoccur every 24
		    hours.
    */
    schedule_crcs: function(){
	let schedule = require('node-schedule');
	let today = new Date();
	
	let midnight = new Date(Date.UTC(today.getFullYear(),
					 today.getMonth(),
					 today.getDate() + 0,
					 today.getHours() + 7, today.getMinutes(),
					 today.getSeconds() + 1, 0));
//					 0, 0, 0, 0));
	//ensure we don't accidentally schedule the intervals to start
	//at last night's midnight GMT if it already passed
	if(midnight < new Date())
	    midnight = new Date(Date.UTC(today.getFullYear(),
					 today.getMonth(),
					 today.getDate(),
					 today.getHours() + 7, today.getMinutes(),
					 today.getSeconds() + 1, 0));
//						 0, 0, 0, 0));
	
	schedule.scheduleJob(midnight, () => {
	    start_cola_rate_change_script();
	});
	console.log("Cola rate change script schduled to start at: " + midnight);
    }
}
    /* name: start_cola_rate_change_script
       preconditions: None
       postconditions: cola_rate_change script will continue to run at
       set intervals every 24 hours at 00:00:00 GMT
       description: This method must be run just once upon server startup.
    */
function start_cola_rate_change_script(){
    set_interval.start(() => {
	let changed_rates = [];
	after_load('https://aoprals.state.gov/Web920/cola.asp', html => {
	    const scraped = parse_cola_page(html);
	    check_rate_changes(scraped, changed_rates)
		.then(() => {
		    update_changed_rates(changed_rates)
			.then(() => {
			    console.log(new Date() + ': COLA rates updated');
			    //now call method to manip templates and send emails
			    emails.start_sending_emails(changed_rates);
			})  
		})
		.catch(err => {
		    console.log(err)
		})
	});
    },
		       6000, 'update_cola_rates');
//		       24 * 60 * 60 * 1000, 'update_cola_rates');
}
/* name: update_changed_rates
   preconditions: changed_rates is array of objects for each post that has changed and
                  needs to be UPDATed in db
   postconditions: All posts described in changed_rates hae been changed.
                   Returns a promise that doesnt resolve until all queries have
		   been completed.
   description: UPDATE each row allowance in db corresponding to changed_rates[].id
*/
function update_changed_rates(changed_rates){
    let queries = [];
    
    changed_rates.forEach(changed => {
	let query = db.update_cola_rate(changed.id, changed.allowance)
	    .catch(err => {
		console.log(err);
		reject(err);
		})
	queries.push(query);
    });
    
    return new Promise((resolve, reject) => {
	Promise.all(queries).then(() =>{
	    resolve();
	});
    })
}
/* name: check_rate_changes
   preconditions: scraped_rates contains array of objects obtained by scraping
                  of the form {country:country, post: post, allowance: allowance}
		  changed_rates is empty array
   postconditions: If any rates have changed since last checked, changed_rates contains
                   information about each post and new allowance. Returns a promise
		   that does not resolve until all db queries have been completed.
   description: Take each element in scraped_rates obtained from scraping
                from https://aoprals.state.gov/Web920/cola.asp webpage, select the 
		corresponding element/post in db and compare previous allowance to
		newly scraped allowance. If allowance is different, add to changed_rates
		array.
*/
function check_rate_changes(scraped_rates, changed_rates){
    let queries = []; 
    scraped_rates.forEach(element => {
	let query = db.get_cola_rate(element.country, element.post)
	    .then(res => {
		try{
		    if(res[0] && res[0].allowance != element.allowance){
			changed_rates.push({
			    id: res[0].id,
			    country: res[0].country,
			    post: res[0].post,
			    previous_allowance: res[0].allowance,
			    allowance: element.allowance,
			    previously_last_modified: res[0].last_modified
			});
		    }
		    else if(!res[0]){
			console.log("Post does not exist in db: "
				    + element.post + ", " + element.country + ". Adding...");
			let add_query = db.add_cola_rate(element.country, element.post, element.allowance)
			    .then(res => console.log("Added new post: " + element.post + ", "
						     + element.country + "."))
			    .catch(err => console.log(err + "\nError adding "
						      + element.post + ", "
						      + element.country + "."))
			queries.push(add_query);
		    }   
		}
		catch(err){
		    console.log(err);
		    console.log("Error updating values.");
		}
	    })
	    .catch(err => {
		console.log(err);
		reject(err);
	    })
	queries.push(query);
    });

    return new Promise((resolve, reject) => {
	Promise.all(queries).then(() =>{
	    resolve();
	});
    })
}
    
/* name: parse_cola_page
   preconditions: html is passed as string containing html page
                  in which any js for that page has already made
                  any necessary changes on that page, as interpreted
		  by after-load
   postconditions: return array of objects containing country, post
                   and post_allowance for all posts on
		   https://aoprals.state.gov/Web920/cola.asp
   description: parse_cola_page takes in the html string from cola
                webpage as argument, then uses cherio module to
		use jquery-like method calls on html page. Country,
		post, and post_allowance are then scraped from each
		row, stored in an object, and pushed into array
		that is returned from this method.
*/
function parse_cola_page(html){
    const cherio = require('cherio');
    var context = [];
    const $ = cherio.load(html);
    
    $('.web920_left tr').each((index, tr) => {
	const country = $(tr)
	      .find('td[title="Country Name"]')
	      .find('a').text();
	const post = $(tr)
	      .find('td[title="Post Name"]')
	      .text();
	const post_allowance = $(tr)
	      .find('td[title="Post Allowance"]')
	      .text();
	if(country != '')
	    context.push({
		country: country,
		post: post,
		allowance: post_allowance.slice(0, post_allowance.search(/%/))
	    });
    })
    return context;
}
