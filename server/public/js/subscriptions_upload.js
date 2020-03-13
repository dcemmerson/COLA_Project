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
	preview_new_subscription();
    });
    $('#submitNewSubscription').on('click', e => {
	e.preventDefault();
	submit_new_subscription();
    });
    
});

function submit_new_subscription(){
    let upload_temp = $('#uploadTemplate');
    let prev_temp = $('#choosePreviousTemplate');
    let post = $('#searchPosts')[0];
    let post_id = post[post.selectedIndex].getAttribute('data-COLARatesId');
    
    if(upload_temp[0].value){
	add_new_subscription_with_template_file(post_id, upload_temp);
    }
    else if(prev_temp.selectedIndex != 0){
	add_new_subscription_prev_template(post_id, prev_temp[0]);
    }
}

async function add_new_subscription_prev_template(post_id, prev_temp){     
    try {
	let context ={};
	context.post_id = post_id;
	context.template_id = prev_temp[prev_temp.selectedIndex].getAttribute('data-templateId');
	
	let response = await fetch('/add_new_subscription_with_prev_template', {
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/JSON'
	    },
	    body: JSON.stringify(context)
	})
	
    }
    catch(err) {
	document.getElementById('addSubscriptionMessageDiv').innerText = "Error uploading template";
	console.log(err);
    }

}

async function add_new_subscription_with_template_filefile(post_id, upload_temp){
    if(!window.File || !window.FileReader || !window.FileList || !window.Blob){
	console.log("File API not supported by broser");
	$('addSubscriptionMessageDiv').innerText = "Incompatible browser"
	return;
    }
    
    try {
	let fd = new FormData();
	fd.append('upload', upload_temp[0].files[0]);
	fd.append('post_id', post_id);
	
	let response = await fetch('/add_new_subscription_with_template_file', {
	    method: 'POST',
	    body: fd
	})
    }
    catch(err) {
	document.getElementById('addSubscriptionMessageDiv').innerText = "Error uploading template";
	console.log(err);
    }

}

function preview_new_subscription(){
    let uploadTemp = $('#uploadTemplate');
    let prevTemp = $('#choosePreviousTemplate');
    //figure out if user is uploading new template or using previous template
    if(uploadTemp[0].value){
	if(!window.File || !window.FileReader || !window.FileList || !window.Blob){
	    console.log("File API not supoprted by broser");
	    return;
	}
	
	let fileSelected = uploadTemp[0].files;
	
	let fileReader = new FileReader();
	fileReader.onload = function (e) {
	    console.log(fileReader.result);
	}
	fileReader.readAsText(uploadTemp[0].files[0]);
    }
    else{
	template = prevTemp[0][prevTemp[0].selectedIndex].getAttribute('data-templateId');
	fetch_template('/previewTemplate'); 
    }
    console.log(template);
    //	$('#previewModal').modal('toggle');

}

/* https://docs.microsoft.com/en-us/office/dev/add-ins/word/get-the-whole-document-from-an-add-in-for-word */
function read_file(file){
    return new Promise((resolve, reject) => {

	let fileReader = new FileReader();
	//	fileReader.onerror = reject;
	fileReader.onload = function (e) {
	    resolve(fileReader.result)
	}
	fileReader.readAsText(file);
    });
    
}

function getSliceAsync(file, nextSlice, sliceCount, gotAllSlices, docdataSlices, slicesReceived) {
    file.getSliceAsync(nextSlice, function (sliceResult) {
        if (sliceResult.status == "succeeded") {
            if (!gotAllSlices) { // Failed to get all slices, no need to continue.
                return;
            }
	    //store slice in temp array that we will string back together after read whole file
            docdataSlices[sliceResult.value.index] = sliceResult.value.data;
            if (++slicesReceived == sliceCount) {
		// All slices have been received.
		file.closeAsync();
		onGotAllSlices(docdataSlices);
            }
            else {
                getSliceAsync(file, ++nextSlice, sliceCount, gotAllSlices, docdataSlices, slicesReceived);
            }
        }
        else {
            gotAllSlices = false;
            file.closeAsync();
            app.showNotification("getSliceAsync Error:", sliceResult.error.message);
        }
    });
}

function onGotAllSlices(docdataSlices) {
    var docdata = [];
    for (var i = 0; i < docdataSlices.length; i++) {
        docdata = docdata.concat(docdataSlices[i]);
    }

    var fileContent = new String();
    for (var j = 0; j < docdata.length; j++) {
        fileContent += String.fromCharCode(docdata[j]);
    }
}

