/*  filename: template_manip.js
    last modified: 06/23/2020
    description: File contains functions needed to manipulate templates,
                    including injecting COLA Rates and other values such 
                    as date into template, and converting a docx to pdf
                    for file preview in-browser.
*/

const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');
const HOST = process.env.HOST;
var toPdf = require('office-to-pdf');

module.exports = {
    /* name: manipTemplate
       preconditions: user {
                            username is used for accessing correct user's template in separate
			                directory to prevent name conflicts caused by multiple templates with
                            same name.
                            filename is name of file that user gave their template
			   }
	              changed {
                            post is name of post whose rate has changed
                            country is name of country that post belogns to
                            prevAllowance is old allowance before change script ran
                            newAllowance is allowance after change script ran
			       }
       postconditions: username's file has been manipulated and {} fields updated.
                       A new docx has been created, which is returned from maniptemplate
    */
    manipTemplate: function (user, changed) {
        try {
            const today = new Date();
            const dateLong = new Intl.DateTimeFormat('en-US', { month: 'short' })
                .format(changed.effectiveDate);
            const todayDateLong = new Intl.DateTimeFormat('en-US', { month: 'short' })
                .format(today);

            let content = user.file;
            let zip = new PizZip(content);
            let doc = new DocxTemplater();
	    
            doc.loadZip(zip);
            doc.setData({
                old_cola: changed.prevAllowance || changed.previousAllowance,
                new_cola: changed.allowance,
		oldCola: changed.prevAllowance || changed.previousAllownace,
                newCola: changed.allowance,
                date: changed.effectiveDate.getUTCDate()
                    + ` ${dateLong} `
                    + changed.effectiveDate.getUTCFullYear(),
                effective_date: changed.effectiveDate.getUTCDate()
                    + ` ${dateLong} `
                    + changed.effectiveDate.getUTCFullYear(),
                current_date: today.getUTCDate()
                    + ` ${todayDateLong} `
                    + today.getUTCFullYear(),
		effectiveDate: changed.effectiveDate.getUTCDate()
                    + ` ${dateLong} `
                    + changed.effectiveDate.getUTCFullYear(),
                currentDate: today.getUTCDate()
                    + ` ${todayDateLong} `
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
	    if(err) console.log(err);
	    
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

    /*  name: docxToPdf
        preconditions: docxBuffer is a blob from db that was uploaded by user,
                        validated in misc.validateFile, stored in our db, and now
                        is being selected by user to display an in-browser preview
                        of the document.
        postconditions: Reolves with buffer containing file as pdf.
    */
    docxToPdf: function (docxBuffer) {
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
