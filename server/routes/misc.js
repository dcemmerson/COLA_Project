const cherio = require('cherio');

module.exports = {
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
    },

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
    
    
}
