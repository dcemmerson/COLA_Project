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
    $('#submitNewSubscription').on('click', async e => {
	e.preventDefault();
	show_spinner($('#addNewSubscriptionButtons')[0]);
	await submit_new_subscription();
	remove_spinner($('#addNewSubscriptionButtons')[0]);
    });
    
});

async function submit_new_subscription(){
    let upload_temp = $('#uploadTemplate');
    let prev_temp = $('#choosePreviousTemplate');
    let post = $('#searchPosts')[0];
    let post_id = post[post.selectedIndex].getAttribute('data-COLARatesId');
    
    if(upload_temp[0].value){
	await add_new_subscription_with_template_file(post_id, upload_temp);
    }
    else if(prev_temp.selectedIndex != 0){
	await add_new_subscription_prev_template(post_id, prev_temp[0]);
    }
    
    show_spinner($('#subscriptionsContainer')[0]);
    clear_user_subscriptions();
    await fetch_user_subscription_list();
    remove_spinner($('#subscriptionsContainer')[0]);
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
	let error_div = document.getElementById('addSubscriptionMessageDiv');
	error_div.hidden = false;
	error_div.innerText = "Error creating new subscription";
	error_div.setAttribute('class', 'errorMessage');
	hidden_timer(error_div)
	console.log(err);
	return;
    }
    new_subscription_success(post_id);
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
	
	let response = await fetch('/add_new_subscription_with_template_file', {
	    method: 'POST',
	    body: fd
	})
    }
    catch(err) {
	let error_div = document.getElementById('addSubscriptionMessageDiv');
	error_div.hidden = false;
	error_div.innerText = "Error uploading template";
	error_div.setAttribute('class', 'errorMessage');
	hidden_timer(error_div)
	console.log(err);
	return;
    }
    new_subscription_success(post_id);
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

async function fetch_user_subscription_list(){
    try{
	clear_user_subscriptions();
	let response = await fetch('/get_user_subscription_list')
	let res = await response.json();
	
	let tbody = document.getElementById('subscriptionTbody');
	res.subscription_list.forEach(sub => {
	    let last_mod = new Date(sub.last_modified);
	    let last_mod_month = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(last_mod);
	    let tr = document.createElement('tr');
	    tr.setAttribute('data-subscriptionId', sub.subscriptionId);
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
	    let td5 = document.createElement('td');
	    let del_btn = document.createElement('button');
	    del_btn.setAttribute('class', 'btn btn-sm btn-danger');
	    del_btn.setAttribute('data-subscriptionId', sub.subscriptionId); 
	    del_btn.addEventListener('click', delete_subscription);
	    let del_btn_text = document.createElement('span');
	    del_btn_text.innerText = 'Remove';

	    del_btn.appendChild(del_btn_text);
	    td5.appendChild(del_btn);
	    tr.appendChild(td5);
	    
	    tbody.appendChild(tr);
	})
	remove_spinner($('#subscriptionsContainer')[0]);
    }
    catch(err) {
	console.log(err);
    }
}

async function delete_subscription(){
    var context = {};
    context.subscriptionId = this.getAttribute('data-subscriptionId');
    clear_user_subscriptions();
    size_table();

    let response = await fetch('/delete_subscription', {
	method: 'POST',
	headers: {
	    'Content-Type': 'application/JSON'
	},
	body: JSON.stringify(context)
    })
    fetch_user_subscription_list();
    size_table();
}
