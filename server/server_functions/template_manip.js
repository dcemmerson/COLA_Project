//require('dotenv').config();
const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');
const HOST = process.env.HOST;
var toPdf = require('office-to-pdf');
//var tpPdf = require('docx-pdf');

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
    manip_template: function (user, changed) {
        try {
            const today = new Date();
            const date_long = new Intl.DateTimeFormat('en-US', { month: 'short' })
                .format(changed.effectiveDate);
            const today_date_long = new Intl.DateTimeFormat('en-US', { month: 'short' })
                .format(today);

            let content = user.file;
            let zip = new PizZip(content);
            let doc = new DocxTemplater();

            doc.loadZip(zip);
            doc.setData({
                old_cola: changed.previous_allowance || changed.prevAllowance,
                new_cola: changed.allowance,
                date: changed.effectiveDate.getUTCDate()
                    + ` ${date_long} `
                    + changed.effectiveDate.getUTCFullYear(),
                effective_date: changed.effectiveDate.getUTCDate()
                    + ` ${date_long} `
                    + changed.effectiveDate.getUTCFullYear(),
                current_date: today.getUTCDate()
                    + ` ${today_date_long} `
                    + today.getUTCFullYear(),
                post: changed.post,
                country: changed.country,
                mgt_number: "Mgt no."
            });
            doc.render();
            user.fileError = false;

            return doc.getZip().generate({ type: 'nodebuffer' });
        }
        catch (err) {
            user.fileError = true;

            user.errorFilename = user.filename;
            user.filename = 'error.txt';

            console.log(`Error: cannot manipulate template ${user.errorFilename} owned by`
                + ` ${user.username} for ${changed.country} (${changed.post}).`);
            return Buffer.from(
                `The template file ${user.errorFilename} uploaded by ${user.username},`
                + ` for ${changed.country} (${changed.post}),`
                + ` is either of an unsupported format (not .doc or .docx),`
                + ` or is corrupted. Please login to ${HOST} to remedy problem.`
                + `\n\nIt is recommended that you unsubscribe from this post`
                + ` and create a new subscription to this post with a new template file.`);
        }
    },
    docx_to_pdf: function (docxBuffer) {
        return new Promise((resolve, reject) => {
            toPdf(docxBuffer)
                .then(pdfBuffer => {
                    resolve(pdfBuffer);
                })
                .catch(err => {
                    console.log(err);
                    reject();
                })
        });
    }

}
