const db = require('./db_functions.js');

module.exports = {
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
    check_rate_changes: function(scraped_rates, changed_rates){
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
    /* name: update_changed_rates
       preconditions: changed_rates is array of objects for each post that has changed and
                      needs to be UPDATed in db
       postconditions: All posts described in changed_rates hae been changed.
                       Returns a promise that doesnt resolve until all queries have
		       been completed.
       description: UPDATE each row allowance in db corresponding to changed_rates[].id
    */
    update_changed_rates: function(changed_rates){
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
}
