/* file contains elements related to preview/submit templates for subscriptions */
document.addEventListener('DOMContentLoaded', () => {
    /* register event handlers to ensure user does only one of the following:
       a. upload a new template to use when creating new subscription
       b. select a previous template to use with new subscription
    */
    $('#choosePreviousTemplate').change(() => {
	document.getElementById('uploadTemplate').value = '';
    });
    $('#uploadTemplate').on('input', () => {
	let select = document.getElementById('choosePreviousTemplate');
	select.selectedIndex = 0;
    });

    $('#previewNewSubscription').on('click', e => {
	e.preventDefault();
	let uploadTemp = $('#uploadTemplate');
	let prevTemp = $('#choosePreviousTemplate');
	//figure out if user is uploading new template or using previous template
	if(uploadTemp[0].value){
	    if(!window.File || !window.FileReader || !window.FileList || !window.Blob){
		console.log("File API not supported by broser");
		return;
	    }
	   
	    let fileSelected = uploadTemp[0].files;
	    
	    let fileReader = new FileReader();
	    fileReader.onload = function (e) {
		console.log(fileReader.result);
	    }
	    fileReader.readAsText(fileSelected);
	}
	else{
	    template = prevTemp[0][prevTemp[0].selectedIndex].getAttribute('data-templateId');
	    fetch_template('/previewTemplate'); 
	}
	console.log(template);
//	$('#previewModal').modal('toggle');

    });
    $('#submitNewSubscription').on('click', e => {
	e.preventDefault();
    });
});
