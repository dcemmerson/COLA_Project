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

async function template_preview(templateId){
    var label = document.getElementById('previewTemplateLabel');
    var docContainer = document.getElementById('canvasSpinnerContainer');
    
    label.innerText = "Loading ";
    show_spinner(docContainer, '-lg');
    show_spinner(label);
    $('#previewTemplateModal').modal({keyboard: true, focus: true});

    
    fetch(`preview_template?templateId=${templateId}`)
	.then(response => {
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

async function submit_new_subscription(){
    let upload_temp = $('#uploadTemplate');
    let prev_temp = $('#templateSelect');
    let post = $('#postSelect')[0];
    let post_id = post[post.selectedIndex].getAttribute('data-COLARatesId');

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
	    fetch_user_templates()
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
    

    //MOVE INTO final part of previous try/catch
    //keep this in a separate try/catch statement. Will ensure if there is
    //an error at some point in the above try catch, the subscription list
    //will remain accurate, even if we deleted the subscription on server
    //and at some later point something unexpectedly threw an error.
    try{
	show_spinner($('#subscriptionsContainerSpinner')[0]);
	clear_user_subscriptions();
	await fetch_user_subscription_list();
    }
    catch(err){
	console.log(err);
    }
    remove_spinner($('#subscriptionsContainerSpinner')[0]);
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

function populate_subscription_table(res){
    let tbody = document.getElementById('subscriptionTbody');
    res.subscription_list.forEach(sub => {
	let last_mod = new Date(sub.last_modified);
	let last_mod_month = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(last_mod);
	let tr = document.createElement('tr');
	tr.setAttribute('data-subscriptionId', sub.subscriptionId);
	
	let td5 = document.createElement('td');
	let del_btn = document.createElement('button');
	del_btn.setAttribute('class', 'btn-clear btn-minus-tiny');
	del_btn.setAttribute('data-subscriptionId', sub.subscriptionId); 
	del_btn.addEventListener('click', () =>{
	    delete_subscription(sub.tok, sub.post, sub.country);
	});
	del_btn.setAttribute('title', `Delete ${sub.country} (${sub.post}) subscription`);
	let minimg = document.createElement('img');
	minimg.setAttribute('src', '/img/minus-cust.png');

	del_btn.appendChild(minimg);
	td5.appendChild(del_btn);
	tr.appendChild(td5);

	let td1 = document.createElement('td');
	td1.innerText = sub.post;
	tr.appendChild(td1);
	let td2 = document.createElement('td');
	td2.innerText = sub.country;
	tr.appendChild(td2);
	let td3 = document.createElement('td');
	td3.innerText = sub.allowance;
	tr.appendChild(td3);
	let td4 = document.createElement('td');
	td4.innerText = last_mod.getDate() + ' '
	    + last_mod_month + ' '
	    + last_mod.getFullYear();
	tr.appendChild(td4);
	
	tbody.appendChild(tr);
    })
}

/* name: delete_subscription
   preconditions: tok contains all necessary info needed in /delete_subscriptions route,
                    most importantly subscriptionId and makeActive (bool)
		  post/country technically not necessary, and will only be required if an
		    unexpected error occurs, to display to user - else, not needed.
   postconditions: subscription has been either deactivated or reactivated, depending on
                   calling context and token
*/
async function delete_subscription(tok, post, country){
    try{
	var context = {};
	hide_elements($('.unsubscribeAlert'));
	var scroll = scroll_save([
	    document.getElementsByTagName('html')[0],
	    document.getElementById('subscriptionsContainer')
	]);
	
//	context.subscriptionId = subscriptionId;
	
	clear_user_subscriptions();
	show_spinner($('#subscriptionsContainerSpinner')[0]);
	
	let response = await fetch(`/delete_subscription?tok=${tok}`)
	let res = await response.json();

	if(res.deleted){
	    display_unsubscribe_alert($('#unsubscribeAlertSuccess')[0],
				      res.post, res.country, res.tok);
	}
	else if(res.restored){
	    display_unsubscribe_alert($('#resubscribeAlertSuccess')[0],
				      res.post, res.country);
	}
	else
	    throw new Error(`Error updating ${res.country} (${res.post})`);
	

    }
    catch(err){
	if(err) console.log(err);
	display_unsubscribe_alert($('#unsubscribeAlertError')[0], post, country)	
    }
    await fetch_user_subscription_list();
    
    scroll_restore(scroll);
}
