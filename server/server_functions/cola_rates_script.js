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
    },

    scrape_previous_cola_rates: async function(){
	try {
//	    let rateDates = set_previous_dates(new Date('March 3, 2019'));
//	    let rateDates = set_previous_dates(new Date('March 1, 2020'));
	    //	    let rateDates = set_previous_dates(new Date('May 10, 2020'));
	    let rateDates = set_previous_dates(new Date('March 11, 2012'));
	    
	    let scrape = await check_previous_rates_99();
	    let counter = 1;
	    
	    while(scrape === true && counter < rateDates.length){
		console.log('start scrape again ' + counter);
		let prevRates = await scrape_previous_allowances(rateDates[counter].dateStr);
		//		console.log(prevRates);

		if(prevRates.length === 0) return;
		
		await update_previous_allowances(prevRates, rateDates[counter - 1].date);
		
		scrape = await check_previous_rates_99();
		counter++;
	    }
	}
	catch(err) {
	    console.log(err);
	}
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
		.then(() => update_changed_rates(changed_rates))
	    	.then(() => {
		    console.log(new Date() + ': COLA rates updated');
		    emails.start_sending_emails(changed_rates);
		})
		.catch(err => {
		    console.log(err)
		})
	});
    },
//		       6000, 'update_cola_rates');
		       24 * 60 * 60 * 1000, 'update_cola_rates');
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
	let query = db.update_cola_rate(changed.postId, changed.allowance, changed.previous_allowance)
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
//			    id: res[0].id,
			    postId: res[0].id,
			    country: res[0].country,
			    post: res[0].post,
			    previous_allowance: res[0].allowance,
			    allowance: element.allowance,
			    last_modified: new Date(),
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

/******************************************************************/
/************ functions for setting prev allowances ***************/
/*************** Note used in app anywhere else *******************/
/******************************************************************/


function check_previous_rates_99(){
    return new Promise((resolve, reject) => {
	db.get_prev_allowances_99()
	    .then(res => {
		if(res.length > 0){
		    console.log(res.length + " posts remaining with previous allowance of -99");
		    resolve(true);
		}
		else {
		    console.log("All posts' previous allowances updated.");
		    resolve(false);
		    
		}
		
	    })
	    .catch(err => {
		console.log('error in check_previous_rates_99');
		reject(err);
	    })
    })
}
function scrape_previous_allowances(date){
	let changed_rates = [];
    return new Promise((resolve, reject) => {
	console.log(`trying to scrape: https://aoprals.state.gov/Web920/cola.asp?EffectiveDate=${date}`);
	after_load(`https://aoprals.state.gov/Web920/cola.asp?EffectiveDate=${date}`,html => {
	    let prevRates = parse_cola_page(html);
	    if(prevRates.length == 0) console.log('No scraped data ' + date);
	    resolve(prevRates);
	    
	});
    })
}
function update_previous_allowances(prevRates, effectiveDate){
    return new Promise((resolve, reject) => {
	let awaitPromises = [];
	prevRates.forEach(prevRate => {
	    let query = db.get_cola_rate(prevRate.country, prevRate.post)
		.then(dbRes => {
		   
		    if(dbRes[0].prevAllowance == -99 && dbRes[0].allowance != prevRate.allowance){
			//update prevAllowance for this post in db
			return db.set_prev_allowance(dbRes[0].id, prevRate.allowance, effectiveDate);
		    }
		    else{
			return;
		    }
		})
		.then(dbRes => {
		    if(dbRes && dbRes.affectedRows === 1){
			console.log(`Updated ${prevRate.post}, ${prevRate.country}, `
				    + `set allowance = ${prevRate.allowance}`);
		    }
		})
		.catch(err => {
		    
		    console.log(`Post no longer exists: ${prevRate.post}, ${prevRate.country}.`);
//		    console.log(err);
		    return;
		})
	    awaitPromises.push(query);
	})
	Promise.all(awaitPromises)
	    .then(() => {
		resolve();
	    })
	    .catch(err => {
		console.log('error in update previous allowances');
		reject(err);
	    })
    })
}

function set_previous_dates(start){
    let rateDates = [];

    //start i at -1 so we can start first scrape date as a future scrape date.
    //This way, if the first time we detect a change in the COLA rates on the
    //first valid scrape date that isnt the start scrape date, we can correctly
    //update the last_modified, aka effective date, in the db
    for(let i = -1; i < 400; i++){
	let date = new Date(start - i * 14 * 1000 * 60 * 60 * 24 );
	let dateString = String(date.getFullYear());

	if(date.getMonth() < 9) dateString +=  "0";
	
	dateString += String(date.getMonth() + 1);
	
	if(date.getDate() < 10) dateString += "0";
	dateString += String(date.getDate());
	
	console.log(date);
	console.log(dateString);
	
	rateDates.push({
	    dateStr: dateString,
	    date: date
	});
    }
    
    return rateDates;	    
}
