/* file contains elements related to preview/submit templates for subscriptions */
document.addEventListener('DOMContentLoaded', () => {
    /* register event handlers to ensure user does only one of the following:
       a. upload a new template to use when creating new subscription
       b. select a previous template to use with new subscription
    */
    $('#templateSelect').change(() => {
	document.getElementById('uploadTemplate').value = '';
	validate_subscription();
    });
    $('#uploadTemplate').on('input', () => {
	let select = document.getElementById('templateSelect');
	select.selectedIndex = 0;
	validate_subscription();
    });

    $('#submitNewSubscription').on('click', async e => {
	e.preventDefault();
	$('#submitNewSubscription')[0].disabled = true;
	show_spinner($('#addNewSubscriptionButtons')[0]);

	var scroll = scroll_save([
	    document.getElementsByTagName('body')[0],
	    document.getElementById('subscriptionsContainer')
	]);
	
	if(validate_subscription(true))
	    await submit_new_subscription();
	
	$('#submitNewSubscription')[0].disabled = false;
	remove_spinner($('#addNewSubscriptionButtons')[0]);
	scroll_restore(scroll);
    });
    
});

function template_preview(templateId, tok=null){
    var label = document.getElementById('previewTemplateLabel');
    var docContainer = document.getElementById('canvasSpinnerContainer');
    
    label.innerText = "Loading ";
    show_spinner(docContainer, '-lg');
    show_spinner(label);
    $('#previewTemplateModal').modal({keyboard: true, focus: true});

    let fe;
    
    if(templateId){
	fe = fetch(`/preview_template?templateId=${templateId}`)
    }
    else{
	fe = fetch(`/preview_subscription?tok=${tok}`)
    }

    fe.then(response => {
	    if(response.status == 200)
		return response.json();
	    throw new Error("Error retrieving file");
	})
	.then(res => {
	    if(!res.success)
		throw new Error("Error retrieving file");
	    remove_spinner(label);
	    label.innerText = res.filename;
	    let uint8arr = new Uint8Array(res.file.data);
	    return pdf_to_canvas(uint8arr);
	})
	.then(() => {
	    document.getElementById('previewCanvas').classList.add('light-border');
	})
	.catch(err => {
	    console.log(err);
	    label.innerText = err;
	})
	.finally(() =>{
	    remove_spinner(docContainer, '-lg');
	    docContainer.innerText = "";
	})
}
function template_download(templateId){
    var dlts = document.getElementById('downloadTemplateSpan');
    dlts.classList.remove('downloadError', 'downloadSuccess');

    show_spinner(dlts, ' md', true);
    return fetch(`/download_template?templateId=${templateId}`)
	.then(response => {
	    if(response.status == 200)
		return response.json();
	    throw new Error("Error retrieving file");
	})
	.then(res => {
	    if(!res.success)
		throw new Error("Error retrieving file");

	    client_download_file(res);

	    dlts.classList.add('downloadSuccess');
	})
	.catch(err => {
	    console.log(err);
	    dlts.classList.add('downloadError');
	})
	.finally(() =>{
	    remove_spinner(dlts, ' md');
	})
    
}

async function submit_new_subscription(){
    let upload_temp = $('#uploadTemplate');
    let prev_temp = $('#templateSelect');
    let post = $('#postSelect')[0];
    let post_id = post[post.selectedIndex].getAttribute('data-COLARatesId');

    show_spinner($('#subscriptionsContainerSpinner')[0]);
    document.getElementById('tableSpinner').display = 'inline-block';

    try{
	if(upload_temp[0].value){
	    var upload = true;
	    var result = await add_new_subscription_with_template_file(post_id, upload_temp);
	}
	else if(prev_temp[0].selectedIndex != 0){
	    var previous = true;
	    var result = await add_new_subscription_prev_template(post_id, prev_temp[0]);
	}

	if(result.success){ //reset post dropdown/files selection
	    post.selectedIndex = 0;
	    prev_temp[0].selectedIndex = 0;
	    upload_temp[0].value = "";
	    new_subscription_success(post_id);
	    
	    let tempFetch = fetch_user_templates();

	    add_subscription_to_table(result);
	}
	else if(result.error)
	    throw new Error(result.error); //custom error originating from server
	else
	    throw result; //something else went wrong
    }
    catch(err){
	hide_elements($('.alert'));
	if(!result.success){
	    $('#warningContainer')[0].style.display = 'block';
	    if(upload){
		$('#uploadTemplateErrorMsg')[0].innerText = result.errorMessage;
		$('#uploadTemplateErrorMsg')[0].style.display = 'block';
	    }
	    else{
		$('#previousTemplateErrorMsg')[0].innerText = result.errorMessage;
		$('#previousTemplateErrorMsg')[0].style.display = 'block';
	    }
	}
	else{
	    $('#errorContainer')[0].style.display = 'block';
	    
	}
    }
    finally{
//	clear_user_subscriptions();
	//	await fetch_user_subscription_list();
	document.getElementById('tableSpinner').display = 'none';
	remove_spinner($('#subscriptionsContainerSpinner')[0]);
    }
}

async function add_new_subscription_prev_template(post_id, prev_temp){     
    try {
	let context = {
	    post_id: post_id,
	    template_id: prev_temp[prev_temp.selectedIndex].getAttribute('data-templateId')
	};
	
	var response = await fetch('/add_new_subscription_with_prev_template', {
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/JSON'
	    },
	    body: JSON.stringify(context)
	})
	
	return await response.json();
    }
    catch(err) {
	console.log(err);
	return err;
    }
}

async function add_new_subscription_with_template_file(post_id, upload_temp){
    if(!window.File || !window.FileReader || !window.FileList || !window.Blob){
	console.log("File API not supported by broser");
	$('addSubscriptionMessageDiv').innerText = "Incompatible browser"
	return;
    }
    
    try {
	let fd = new FormData();
	fd.append('upload', upload_temp[0].files[0]);
	fd.append('post_id', post_id);
	
	var response = await fetch('/add_new_subscription_with_template_file', {
	    method: 'POST',
	    body: fd
	})
	
	return await response.json();
    }
    catch(err) {	
	console.log(err);
	return err;
    }
}



async function fetch_user_templates(){
    try{
	var templateSelect = document.getElementById('templateSelect');
	clear_dropdown(templateSelect);
	templateSelect.innerHTML = '<option>Loading...<i class="fa fa-spinner spinner"></i></option>';
	
	let response = await fetch('/get_user_template_list')
	let res = await response.json();

	clear_dropdown(templateSelect);
	
	populate_template_dropdown(templateSelect, res.templates);
    }
    catch(err) {
	console.log(err);
	templateSelect.innerHTML = '<option>Error retrieving templates</option>';
    }
    finally{
	console.log('finally');
    }
}

async function fetch_user_subscription_list(){
    try{
	clear_user_subscriptions();
	let response = await fetch('/get_user_subscription_list')
	let res = await response.json();
	remove_spinner($('#subscriptionsContainerSpinner')[0]);
	populate_subscription_table(res);
	check_empty_subscriptions();
    }
    catch(err) {
	console.log(err);
    }
    finally{
	size_table();
    }
}



/* name: delete_subscription
   preconditions: tok contains all necessary info needed in /delete_subscriptions route,
                    most importantly subscriptionId and makeActive (bool)
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been either deactivated or reactivated, depending on
                   calling context and token
*/
async function delete_subscription(thisEl, tok, post, country, subscriptionId){
    try{
	var context = {};
	var spinner = document.getElementById('tableSpinner');
	var tableCover = document.getElementById('tableCover');

	if(thisEl){
	    thisEl.parentNode.disabled = true;
	    class_timer(thisEl, 'trashCan', 'trashCanSecondary');
	}

	tableCover.style.display = 'block';
	spinner.style.display = 'inline-block';
	
	let response = await fetch(`/delete_subscription?tok=${tok}`)
	let res = await response.json();


	hide_elements($('.unsubscribeAlert'));
	if(res.deleted){
	    display_unsubscribe_alert($('#unsubscribeAlertSuccess')[0],
				      res.post, res.country, res.tok, subscriptionId);
	    update_table(subscriptionId, true);
	    
	}
	else if(res.restored){
	    display_unsubscribe_alert($('#resubscribeAlertSuccess')[0],
				      res.post, res.country);
	    update_table(subscriptionId, false);
	}
	else
	    throw new Error(`Error updating ${res.country} (${res.post})`);

    }
    catch(err){
	if(err) console.log(err);
	display_unsubscribe_alert($('#unsubscribeAlertError')[0], post, country);	
    }
    finally{
	
	if(thisEl){
	    thisEl.parentNode.disabled = false;
	    class_timer(thisEl, 'trashCanSecondary', 'trashCan');
	}
	tableCover.style.display = 'block';
//	tableCover.style.animation = 'slideCoverRemove 0.5s 1 forwards';
	spinner.style.display = 'none';
    }
//    await fetch_user_subscription_list();
    
//    scroll_restore(scroll);
}


/* name: download_subscription
   preconditions: tok contains all necessary info needed in /download_subscription route,
                    most importantly subscriptionId. Server validates requested template 
		    belongs to requester. 
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
                   if error occurred somewhere in process.
*/
function download_subscription(thisEl, tok, post, country){
    var spinner = document.getElementById('tableSpinner');
    spinner.style.display = 'inline-block';

    thisEl.parentNode.disabled = true;
    class_timer(thisEl, 'downloadSubscription', 'downloadSubscriptionSecondary');    
    return fetch(`/download_subscription?tok=${tok}`)
	.then(response => {
	    if(response.status == 200)
		return response.json();
	    throw new Error("Error retrieving file");
	})
	.then(res => {
	    if(!res.success)
		throw new Error("Error retrieving file");

	    client_download_file(res);
	    class_timer(thisEl,  'downloadSubscriptionSecondary', 'downloadSubscriptionSuccess', 'downloadSubscription',5000);
	})
	.catch(err => {
	    console.log(err);
	    hide_elements(document.getElementsByClassName('unsubscribeAlert'));
	    document.getElementById('downloadSubscriptionAlertError').style.display = 'block';
	    document.getElementById('downloadSubscriptionErrorMsgSpan').innerText = `${country} (${post})`;
	    class_timer(thisEl, 'downloadSubscriptionSecondary', 'downloadSubscriptionError', 'downloadSubscription',8000);
	})
	.finally(() => {
	    thisEl.parentNode.disabled = false;
	    spinner.style.display = 'none';

	})
}
/* name: fire_subscription_email
   preconditions: tok contains all necessary info needed in /fire_subscription_email route,
                    most importantly subscriptionId. Server validates requested template 
		    belongs to requester. 
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
		  thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
                   if error occurred somewhere in process.
*/
function fire_subscription_email(thisEl, tok, post, country){
    var spinner = document.getElementById('tableSpinner');
    spinner.style.display = 'inline-block';

    thisEl.parentNode.disabled = true;
    class_timer(thisEl, 'email', 'emailSecondary');
    
    return fetch(`/fire_subscription_email?tok=${tok}`)
	.then(response => {
	    if(response.status == 200)
		return response.json();
	    throw new Error("Error retrieving file");
	})
	.then(res => {
	    if(!res.success)
		throw new Error("Error retrieving file");

	    console.log(res);
//	    client_download_file(res);
	    class_timer(thisEl, 'emailSecondary', 'emailSuccess', 'email',5000);
	})
	.catch(err => {
	    console.log(err);
	    hide_elements(document.getElementsByClassName('unsubscribeAlert'));
	    document.getElementById('fireSubscriptionEmailAlertError').style.display = 'block';
	    document.getElementById('fireSubscriptionEmailErrorMsgSpan').innerText = `${country} (${post})`;
	    document.getElementById('fireSubscriptionEmailErrorToSpan').innerText = document.getElementById('userEmail').value;
	    class_timer(thisEl, 'emailSecondary', 'emailError', 'email',8000);
	})
	.finally(() => {
	    thisEl.parentNode.disabled = false;
	    spinner.style.display = 'none';

	})    
}
