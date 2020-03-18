const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');

module.exports = {
    /* name: manip_template
       preconditions: username is used for accessing correct user's template in separate
                      directory to prevent name conflicts caused by multiple templates with
		      same name.
                      filename is name of file that user gave their template
                      post is name of post whose rate has changed
		      country is name of country that post belogns to
		      prev_allowance is old allowance before change script ran
		      new_allowance is allowance after change script ranx
       postconditions: username's file has been manipulated.
                       A new docx has been created, which is returned from manip_template
       description: 
    */
    manip_template: function(username, filename, file, post, country, prev_allowance,
			     new_allowance, last_modified){
	const date_long = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(last_modified);
	console.log(`date: ${(last_modified.getDate() )} ${date_long} ${last_modified.getFullYear()}`)
	console.log(`utcdate: ${(last_modified.getUTCDate() )} ${date_long} ${last_modified.getUTCFullYear()}`)
	
	let content = file;
	let zip = new PizZip(content);
	let doc = new DocxTemplater();
	doc.loadZip(zip);
	doc.setData({
	    old_cola: prev_allowance,
	    new_cola: new_allowance,
	    date: last_modified.getUTCDate() + ` ${date_long} ` + last_modified.getUTCFullYear(),
	    post: post,
	    country: country,
	    mgt_number: 'idk...'
	});
	doc.render();
	return doc.getZip().generate({type: 'nodebuffer'});;
    }
}
