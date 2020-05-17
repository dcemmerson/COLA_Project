const db = require('./db_functions.js');
const setInterval = require('set-interval');
const afterLoad = require('after-load');
const emails = require('./emails.js');


module.exports = {
    
    /* name: scheduleCrcs
       preconditions: None
       postconditions: cola rate change script has been scheduled to run
                       at 00:00:00 GMT. startColaRateChange_script has
		       been called and will continue to run script every
		       24 hours.
       description: function needs to be called just once at node server startup. Function
                    schedules for script to start at midnihgt, and then reoccur every 24
		    hours.
    */
    scheduleCrcs: function () {
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
        if (midnight < new Date())
            midnight = new Date(Date.UTC(today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                today.getHours() + 7, today.getMinutes(),
                today.getSeconds() + 1, 0));
        //						 0, 0, 0, 0));

        schedule.scheduleJob(midnight, () => {
            startColaRateChangeScript();
        });
        console.log("Cola rate change script schduled to start at: " + midnight);
    },

    /* name: scrapePreviousColaRates
       preconditions: db methond in db_functions.js have been un-commented out
                        to use with this method
       postconditions: The last effective cola rate, which we are calling previous cola rate, 
                         (if exists) on aoprals.state.gov/... have been filled in in our db
			 COLARates tables for each post.
       description: function needs to be called just once at node server startup, only if
                      previousAllowance field in our COLARates table needs to be filled
		      in. This method shouldn't ever need to be run again, so we are leaving
		      it commented out.
    */
/*
    scrapePreviousColaRates: async function () {
        try {
            //	    let rateDates = setPreviousDates(new Date('March 3, 2019'));
            let rateDates = setPreviousDates(new Date('March 1, 2020'));
            //	    let rateDates = setPreviousDates(new Date('May 10, 2020'));
            //	    let rateDates = setPreviousDates(new Date('March 11, 2012'));

            let db99 = await checkPreviousRates99();
            let counter = 1;

            while (db99.length > 0 && counter < rateDates.length) {
                console.log('start scrape again ' + counter);
                let prevRates = await scrapePreviousAllowances(rateDates[counter].dateStr);
                //		console.log(prevRates);

                if (prevRates.rates.length === 0) return;

                await updatePreviousAllowances(prevRates.rates, rateDates[counter - 1].date);

                db99 = await checkPreviousRates99();
                counter++;
            }
        }
        catch (err) {
            console.log(err);
        }
    },
*/
    /* name: scrapeEffectiveDatesNoColaChange
       precondititions: none
       postconditions: effective dates updated in db for posts whose cola rates
                         have not changed since that post's cola rate started
			 being recorded on aoprols.gov...
       description: function needs to be called just once at node server startup, only if
			 previousAllowance field in our COLARates table needs to be filled
			 in for posts whose rates have never changed since they were first
			 recorded on aoprals.state.gov/... 
			 This method shouldn't ever need to be run again, so we are leaving
			 it commented out.
     */
/*
    scrapeEffectiveDatesNoColaChange: async function () {
        try {
            //	    let rateDates = setPreviousDates(new Date('March 3, 2019'));
            //	    let rateDates = setPreviousDates(new Date('March 1, 2020'));
            //	    let rateDates = setPreviousDates(new Date('May 10, 2020'));
            //	    let rateDates = setPreviousDates(new Date('March 11, 2012'));
            let rateDates = setPreviousDates(new Date('March 30, 1997'));


            let db99 = await checkPreviousRates99();
            let counter = 1;

            while (db99.length > 0 && counter < rateDates.length) {
                console.log('start scrape again ' + counter);
                let prevRates = await scrapePreviousAllowances(rateDates[counter].dateStr);
                //		console.log(prevRates);

                if (prevRates.rates.length === 0) {
                    console.log("Exiting script. Issue with scrape dates.");
                    return;
                }

                await updateEffectiveDateNoRateChange(db99, prevRates.rates, rateDates[counter - 1].date);

                //		db99 = await checkPreviousRates99();
                counter++;
            }
        }
        catch (err) {
            console.log(err);
        }
    }
*/
}
/* name: startColaRateChangeScript
   preconditions: None
   postconditions: colaRateChange script will continue to run at
                   set intervals every 24 hours at 00:00:00 GMT
   description: This method must be run just once upon server startup.
*/
function startColaRateChangeScript() {
    setInterval.start(() => {
        let changedRates = [];
        afterLoad('https://aoprals.state.gov/Web920/cola.asp', html => {
            const scraped = parseColaPage(html);
            checkRateChanges(scraped.rates, changedRates, scraped.effectiveDate)
                .then(() => updateChangedRates(changedRates, scraped.effectiveDate))
                .then(() => {
                    console.log(new Date() + ': COLA rates updated');
                    emails.startSendingEmails(changedRates);
                })
                .catch(err => {
                    console.log(err)
                })
        });
    },
        //		       6000, 'updateColaRates');
        24 * 60 * 60 * 1000, 'updateColaRates');
}
/* name: updateChangedRates
   preconditions: changedRates is array of objects for each post that has changed and
                  needs to be UPDATed in db
   postconditions: All posts described in changedRates have been changed.
                   Returns a promise that doesnt resolve until all queries have
		   been completed.
   description: UPDATE each row allowance in db corresponding to changedRates[].id
*/
function updateChangedRates(changedRates, effectiveDate) {
    let queries = [];

    changedRates.forEach(changed => {
        let query = db.updateColaRate(changed.postId, changed.allowance, changed.previousAllowance, effectiveDate)
            .catch(err => {
                console.log(err);
                reject(err);
            })
        queries.push(query);
    });

    return new Promise((resolve, reject) => {
        Promise.all(queries).then(() => {
            resolve();
        });
    })
}
/* name: checkRateChanges
   preconditions: scrapedRates contains array of objects obtained by scraping
                  of the form {country:country, post: post, allowance: allowance}
		  changedRates is empty array
   postconditions: If any rates have changed since last checked, changedRates contains
                   information about each post and new allowance. Returns a promise
		   that does not resolve until all db queries have been completed.
   description: Take each element in scrapedRates obtained from scraping
                from https://aoprals.state.gov/Web920/cola.asp webpage, select the 
		corresponding element/post in db and compare previous allowance to
		newly scraped allowance. If allowance is different, add to changedRates
		array.
*/
function checkRateChanges(scrapedRates, changedRates, effectiveDate) {
    let queries = [];
    scrapedRates.forEach(element => {
        let query = db.getColaRate(element.country, element.post)
            .then(res => {
                try {
                    if (res[0] && res[0].allowance != element.allowance) {
                        changedrates.push({
                            //			    id: res[0].id,
                            postId: res[0].id,
                            country: res[0].country,
                            post: res[0].post,
                            previousAllowance: res[0].allowance,
                            allowance: element.allowance,
                            effectiveDate: new Date(effectiveDate),
                            lastModified: new Date(),
                            previouslyLastModified: res[0].lastModified
                        });
                    }
                    else if (!res[0]) {
                        console.log("Post does not exist in db: "
                            + element.post + ", " + element.country + ". Adding...");
                        return db.addColaRate(element.country, element.post, element.allowance)
                            .then(res => console.log("Added new post: " + element.post + ", "
                                + element.country + "."))
                            .catch(err => console.log(err + "\nError adding "
                                + element.post + ", "
                                + element.country + "."))
                     }
                }
                catch (err) {
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
        Promise.all(queries).then(() => {
            resolve();
        });
    })
}

/* name: parseColaPage
   preconditions: html is passed as string containing html page
                  in which any js for that page has already made
                  any necessary changes on that page, as interpreted
		  by after-load
   postconditions: return array of objects containing country, post
                   and postAllowance for all posts on
		   https://aoprals.state.gov/Web920/cola.asp
   description: parseColaPage takes in the html string from cola
                webpage as argument, then uses cherio module to
		use jquery-like method calls on html page. Country,
		post, and postAllowance are then scraped from each
		row, stored in an object, and pushed into array
		that is returned from this method.
*/
function parseColaPage(html) {
    const cherio = require('cherio');
    var context = {
        effectiveDate: null,
        rates: []
    };
    const $ = cherio.load(html);

    $('.web920_left tr').each((index, tr) => {
        const country = $(tr)
              .find('td[title="Country Name"]')
              .find('a').text();
        const post = $(tr)
              .find('td[title="Post Name"]')
              .text();
        const postAllowance = $(tr)
              .find('td[title="Post Allowance"]')
              .text();
	
        if (country != '')
            context.rates.push({
                country: country,
                post: post,
                allowance: postAllowance.slice(0, postAllowance.search(/%/))
            });
    })

    // also grab effective date from the webpage
    const regex = /(.*?)Rates Effective: (.*?)/;
    context.effectiveDate = new Date($('tr td div h4').text().replace(regex, ''));

    return context;
}

/******************************************************************/
/************ functions for setting prev allowances ***************/
/* Note used in app anywhere else. Commented out as these methods
 were used to scrape historical previous allowance on aoprals.state.gov/...
and should not be needed again 
*/
/******************************************************************/

/* name: checkPreviousRates99
   preconditions: db.getPrevAllowances99 selects all posts with previous
                  allowances of -99 in db
   postconditions: resolve with array of posts whose previous allowance is 
                   still -99
*/
/*
function checkPreviousRates99() {
    return new Promise((resolve, reject) => {
        db.getPrevAllowances99NoEffective()
            .then(res => {
                if (res.length > 0) {
                    console.log(res.length + " posts remaining with previous allowance of -99");
                }
                else {
                    console.log("All posts' previous allowances updated.");
                }
                resolve(res);

            })
            .catch(err => {
                console.log('error in checkPreviousRates99');
                reject(err);
            })
    })
}
function scrapePreviousAllowances(date) {
    let changedRates = [];
    return new Promise((resolve, reject) => {
        console.log(`trying to scrape: https://aoprals.state.gov/Web920/cola.asp?EffectiveDate=${date}`);
        afterLoad(`https://aoprals.state.gov/Web920/cola.asp?EffectiveDate=${date}`, html => {
            let prevRates = parseColaPage(html);
            if (prevRates.rates.length == 0) console.log('No scraped data ' + date);
            resolve(prevRates);

        });
    })
}
function updatePreviousAllowances(prevRates, effectiveDate) {
    return new Promise((resolve, reject) => {
        let awaitPromises = [];
        prevRates.forEach(prevRate => {
            let query = db.getColaRate(prevRate.country, prevRate.post)
                .then(dbRes => {

                    if (dbRes[0].prevAllowance == -99 && dbRes[0].allowance != prevRate.allowance) {
                        //update prevAllowance for this post in db
                        return db.setPrevAllowance(dbRes[0].id, prevRate.allowance, effectiveDate);
                    }
                    else {
                        return;
                    }
                })
                .then(dbRes => {
                    if (dbRes && dbRes.affectedRows === 1) {
                        console.log(`Updated ${prevRate.post}, ${prevRate.country}, `
                            + `set allowance = ${prevRate.allowance}`);
                    }
                })
                .catch(err => {

                    console.log(`Post no longer exists: ${prevRate.post}, ${prevRate.country}.`);
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

function setPreviousDates(start) {
    let rateDates = [];

    //start i at -1 so we can start first scrape date as a future scrape date.
    //This way, if the first time we detect a change in the COLA rates on the
    //first valid scrape date that isnt the start scrape date, we can correctly
    //update the lastModified, aka effective date, in the db
    for (let i = -1; i < 100; i++) {
        let date = new Date(start - i * 14 * 1000 * 60 * 60 * 24);
        let dateString = String(date.getFullYear());

        if (date.getMonth() < 9) dateString += "0";

        dateString += String(date.getMonth() + 1);

        if (date.getDate() < 10) dateString += "0";
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
*/
/******************************************************************/
/* functions for setting effective dates for posts whose allowances 
   have not changed since the posts' cola rates began being recorded 
   on https://aoprals.state.gov/Web920/cola.asp  ******************/
/*************** Note used in app anywhere else *******************/
/******************************************************************/

/* name: updateEffectiveDateNoRateChange
   preconditions: db99Rates is array of lists in db whose previous allowance
                    is still -99 and effective date is therefore currently
		    inaccurate and need to be updated.
                  prevRates is array of rates scraped from aoprals.gov...
                    historical rates
                  effective date is date when those scraped rates would
		    have gone into effect
   postconditions: effective date updated, but only for posts that are
                     included in our db, but not included in the
		     latest scraped rates in prevRates
   description: This method should only be used to attempt to fill
                 in previous effective dates for posts whose cola
		 rates have not been changed since the post cola
		 rates were began recording on aoprols.gov...
		 This method just compares posts in db99Rates to
		 prevRates (which were scraped) and if post is
		 found in db99Rates but not in prevRates, we take
		 that to mean this is the time period when that
		 posts cola rates first began recording on aoprols.gov
		 and update COLARates.effective date.
*/
/*
function updateEffectiveDateNoRateChange(db99Rates, prevRates, effectiveDate) {
    return new Promise((resolve, reject) => {
        let awaitPromises = [];
        db99Rates.forEach((db99Rate, index) => {
            let found = false
            prevRates.forEach(prevRate => {
                if (db99Rate.country == prevRate.country && db99Rate.post == prevRate.post) {
                    found = true;
                }
            })
            if (!found) {
                console.log(`\n\nupdating db for ${db99Rate.post}, ${db99Rate.country},`
                    + ` with effective date = ${effectiveDate}\n\n`);

                awaitPromises.push(db.updateColaRateEffectiveDate(db99Rate.id, effectiveDate));
                db99Rates.splice(index, 1);
            }
        })
        Promise.all(awaitPromises)
            .then(resolve)
    })

}
*/
