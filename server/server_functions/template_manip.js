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
    manip_template: function(user, changed){
	const date_long = new Intl.DateTimeFormat('en-US', {month: 'short'})
	      .format(changed.last_modified);
	let content = user.file;
	let zip = new PizZip(content);
	let doc = new DocxTemplater();
	doc.loadZip(zip);
	doc.setData({
	    old_cola: changed.prev_allowance,
	    new_cola: changed.new_allowance,
	    date: changed.last_modified.getUTCDate()
		+ ` ${date_long} `
		+ changed.last_modified.getUTCFullYear(),
	    post: changed.post,
	    country: changed.country,
	    mgt_number: 'idk...'
	});
	doc.render();
	return doc.getZip().generate({type: 'nodebuffer'});;
    }
}
