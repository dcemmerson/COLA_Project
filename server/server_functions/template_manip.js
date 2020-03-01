const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

module.exports = {
    /* name: manip_template
       preconditions: username is used for accessing correct user's template in separate
                      directory to prevent name conflicts caused by multiple templates with
		      same name.
                      filename is name of file that user gave their template
                      post is name of post whose rate has changed
		      coutnry is name of country that post belogns to
		      prev_allowance is old allowance before change script ran
		      new_allowance is allowance after change script ranx
       postconditions: username's filename has been opened and values have been manipulated.
                       A new docx has been created in templates/${username}/
       description: 
    */
    manip_template: function(username, filename, post, country, prev_allowance, new_allowance){
	let date = new Date();
	date_long = new Intl.DateTimeFormat('en-US', {month: 'long'}).format(date);

	let content = fs.readFileSync(path.resolve(__dirname,
						   `templates/${username}/${filename}`
						  ), 'binary');
	let zip = new PizZip(content);
	let doc = new DocxTemplater();
	doc.loadZip(zip);
	doc.setData({
	    old_cola: prev_allowance,
	    new_cola: new_allowance,
	    date: date_long,
	    post: post,
	    country: country,
	    mgt_number: 'Yellow submarine.'
	});
	doc.render();
	var buf = doc.getZip()
        .generate({type: 'nodebuffer'});
	
	fs.writeFileSync(path.resolve(__dirname, `templates/temp/${filename}`), buf);
	console.log(`wrote '${filename}' to file`);
    }
}
