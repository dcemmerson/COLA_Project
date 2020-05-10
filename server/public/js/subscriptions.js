const LINESPACING = 10;
document.addEventListener('DOMContentLoaded', async () => {
    let subscription_list = await fetch_user_subscription_list();

    //    set_window_prefs();
    initialize_form();
    document.getElementById('subscribeAdditional').addEventListener('click', () => {
	hide_elements($('.alert'));
	$('#infoContainer')[0].style.display = "block";
	$('#subscriptionFormContainer')[0].style.display = "block";
    });
    
    document.getElementById('previewPrevTemplate').addEventListener('click', e => {
	e.preventDefault();
	let tempSelect = document.getElementById('templateSelect');
	let templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

	if(valid_preview()){
	    template_preview(templateId);
	}
    });
    
    document.getElementById('downloadPrevTemplate').addEventListener('click', async function(e) {
	e.preventDefault();
	let tempSelect = document.getElementById('templateSelect');
	let templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

	if(valid_preview(true)){
	    this.disabled = true;
	    await template_download(templateId);
	    this.disabled = false;
	    
	}
    });

    //when user exits modal, reset modal to be ready to user to preview
    //another template
    $('#previewTemplateModal').on('hidden.bs.modal', () => {
	clear_canvas(document.getElementById('previewCanvas'));
	document.getElementById('previewTemplateLabel').innerText = "";
    });
    
});
function pdf_to_canvas(uint8arr){
    return new Promise((resolve, reject) => {
	var loadingTask = pdfjsLib.getDocument(uint8arr);
	loadingTask.promise.then(function(pdf) {
	    pdf.getPage(1)
		.then(function(page) {
		    var scale = 1;
		    var viewport = page.getViewport({scale:scale});

		    var canvas = document.getElementById('previewCanvas');
		    var context = canvas.getContext('2d');
		    canvas.height = viewport.height;
		    canvas.width = viewport.width;

		    var renderContext = {
			canvasContext: context,
			viewport: viewport
		    };
		    page.render(renderContext);
		    resolve();
		    
		})
		.catch(err => {
		    console.log(err);
		    reject("Error generating preview");
		})
	});
    })
}

function set_window_prefs(){
    size_table();
    let in_progress = false;
    window.addEventListener('resize', () => {
	if(!in_progress){
	    in_progress = true;
	    setTimeout(() => {
		size_table();
		in_progress = false;
	    }, 100);	    
	}	
    })
}
function size_table(){
    let size = document.getElementById('subscriptionsTable').clientHeight;

    if(size > (0.6 * window.innerHeight)) size = 0.6 * window.innerHeight;
    if(size < 200) size = 200;
    
    document.getElementById('subscriptionsContainer')
	.setAttribute('style', `max-height:${size}px`);
}

function clear_user_subscriptions(){
    let tbody = document.getElementById('subscriptionTbody');
    while(tbody.firstChild)
	tbody.removeChild(tbody.firstChild);

    $('#subscriptionsTable')[0].style.display = 'none';
    $('#noActiveSubscriptions')[0].style.display = 'none';
    
}

function clear_dropdown(dropdown){
    while(dropdown.firstChild){
	dropdown.removeChild(dropdown.firstChild);
    }
}

function new_subscription_success(postId){
    hide_elements($('.alert'));
    hide_elements($('#subscriptionFormContainer'));
    let successContainer = $('#successContainer')[0];
    successContainer.style.display = 'block';
    
    /////////////// find which post this postId corresponds to ////////////////
    for (let [num, option] of Object.entries($('#postSelect option'))) {
	if(option.getAttribute('data-COLARatesId') == postId){
	    $('#successSpan')[0].innerText = option.innerText;
	    return;
	}
    }
}
function new_subscription_fail(cont, postId){
    let valAlert = $('#infoCont')[0];
    let postVal = $('#postVal')[0];
    let tempVal = $('#templateVal')[0];
    let postSelect = $('#postSelect')[0];
    let upTemp = $('#uploadTemplate')[0];
    let prevTemp = $('#templateSelect')[0];
}

/* name: initialize_form
   preconditions: subscription html DOM content has loaded
   postcondition: if user refreshed page and has a template still selected,
   check if that template is of type doc/docx. If not, then
   highlight it with red border and place x in alert box.
   We didn't use refresh flag on window to ensure there is
   no browser incapatability, as not running this initial
   validation check could cause user confusion if they
   refresh page.
*/
function initialize_form(){
    let tempVal = $('.templateVal');
    let upTemp = $('#uploadTemplate')[0];
    let prevTemp = $('#templateSelect')[0];

    const reg = /(\.doc|\.docx)$/i;
    // check if there is a template selected, if so, run
    // post validation, otherwise don't and just leave checkmarks
    // on alert validation to help user understand the alert is responsive
    if(upTemp.value && !reg.exec(upTemp.value)){
	//ending of file is not .doc or .doc
	remove_classes(tempVal, ['val', 'invalBlank']);
	add_classes(tempVal, ['invalid']);
	upTemp.classList.add('usa-input--error');
	validate_post();
    }
    else if(prevTemp.selectedIndex !== 0
	    && !reg.exec(prevTemp[prevTemp.selectedIndex].value)){
	//ending of file is not .doc or .doc
	remove_classes(tempVal, ['val', 'invalBlank']);
	add_classes(tempVal, ['invalid']);
	prevTemp.classList.add('usa-input--error');
	validate_post();
    }
}

function valid_preview(download=false){
    let prevTemp = document.getElementById('templateSelect');
    document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
    document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
    document.getElementById('downloadTemplateSpan').classList.remove('downloadSuccess', 'downloadError');
    
    if(prevTemp.selectedIndex === 0){
	prevTemp.classList.add('usa-input--error');
	if(download){
	    document.getElementById('previousTemplateErrorMsgDownload').style.display = 'block';
	}
	else{
	    document.getElementById('previousTemplateErrorMsgPreview').style.display = 'block';
	}
	return false;
    }
    else{
	prevTemp.classList.remove('usa-input--error');
	return true;
    }
}
function validate_post(submit=false){
    let postVals = $('.postVal');
    let postSelect = $('#postSelect')[0];

    //////////////////// check for selected post ///////////////////
    if(postSelect.selectedIndex === 0){
	remove_classes(postVals, ['val']);
	add_classes(postVals, ['invalBlank']);
	var valid = false;
	if(submit) postSelect.classList.add('usa-input--error');
    }
    else{
	remove_classes(postVals, ['invalBlank']);
	add_classes(postVals, ['val']);
	postSelect.classList.remove('usa-input--error');
	
	var valid = true;
    }
    return valid;
}
function validate_subscription(submit=false){
    let valid = false;
    let tempVals = $('.templateVal');
    let upTemp = $('#uploadTemplate')[0];
    let prevTemp = $('#templateSelect')[0];
    
    const reg = /(\.doc|\.docx)$/i;
    valid = validate_post(submit);

    ////////////////// check for template - ensure doc/docx ending ///////
    if(!upTemp.value && prevTemp.selectedIndex === 0){
	remove_classes(tempVals, ['val', 'invalid']);
	add_classes(tempVals, ['invalBlank']);

	if(submit){
	    upTemp.classList.add('usa-input--error');
	    prevTemp.classList.add('usa-input--error');
	}
	valid = false;
    }
    else if(!reg.exec(upTemp.value)
	    && !reg.exec(prevTemp[prevTemp.selectedIndex].value)){
	//ending of file is not .doc or .doc
	remove_classes(tempVals, ['val', 'invalBlank']);
	add_classes(tempVals, ['invalid']);

	if(submit){
	    $('#infoContainer')[0].style.display = 'none';
	    $('#warningContainer')[0].style.display = 'block';
	}

	if(upTemp.value){
	    upTemp.classList.add('usa-input--error');
	}
	else if(prevTemp.value){
	    prevTemp.classList.add('usa-input--error');
	}
	valid = false;
    }
    else{ //everything looks okay
	remove_classes(tempVals, ['invalBlank', 'invalid']);
	add_classes(tempVals, ['val']);

	upTemp.classList.remove('usa-input--error');
	prevTemp.classList.remove('usa-input--error');
	valid = valid && true;
	document.getElementById('uploadTemplateErrorMsg').style.display = 'none';
	document.getElementById('previousTemplateErrorMsg').style.display = 'none';
	document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
	document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
    }
    
    
    return valid;
}

function display_unsubscribe_alert(element, post, country, tok, subscriptionId){
    element.getElementsByClassName('unsubscribeMsgSpan')[0].innerText = `${country} (${post})`;
    element.style.display = 'block';
    
    $('#undoLink')[0].setAttribute('data-tok', tok);
    $('#undoLink')[0].setAttribute('data-post', post);
    $('#undoLink')[0].setAttribute('data-country', country);
    $('#undoLink')[0].setAttribute('data-subscriptionId', subscriptionId);
    
    $('#undoLink')[0].removeEventListener('click', restore_subscription);    
    $('#undoLink')[0].addEventListener('click', restore_subscription);

}

function restore_subscription(e){
    e.preventDefault();

    let undoLink = $('#undoLink')[0];
    
    delete_subscription(null, undoLink.getAttribute('data-tok'),
			undoLink.getAttribute('data-post'),
			undoLink.getAttribute('data-country'),
			undoLink.getAttribute('data-subscriptionId'));
    
}

function check_empty_subscriptions(){
    let table = $('#subscriptionsTable')[0];
    let tbody = $('#subscriptionTbody')[0];
    let msgDiv = $('#noActiveSubscriptions')[0];
    
    if(!tbody.firstChild){
	table.style.display = 'none';
	msgDiv.style.display = 'block';
    }
    else{
	table.style.display = 'table';
	msgDiv.style.display = 'none';
    }
}

function dismiss_alert(alert){
    alert.style.display = 'none';
    $('#unsubscribeAlertBlank')[0].style.display = 'block';
}
function populate_template_dropdown(dropdown, templates){
    var option = document.createElement('option');
    dropdown.appendChild(option);
    
    templates.forEach(template => {
	option = document.createElement('option');
	option.setAttribute('data-templateId', template.id);
	option.innerText = template.name;
	
	dropdown.appendChild(option);
    })
}

function add_subscription_to_table(sub){
    let tbody = document.getElementById('subscriptionTbody');
    let rowNum = 0;
    let tr;

    // iterate through table to determine where we should add new row to keep
    // table organized in alphabetical order by country name
    do {
	tr = tbody.getElementsByClassName('subscriptionRow')[rowNum];
	rowNum++;
    } while(tr !== null & tr.getElementsByClassName('countryName')[0].innerText < sub.country);


    var res = {subscription_list: [sub]};
    if(tr === null){
	populate_subscription_table(res);
    }
    else {
	populate_subscription_table(res, rowNum);
    }

	

}
function populate_subscription_table(res, rowNum=null){
    let tbody = document.getElementById('subscriptionTbody');
    res.subscription_list.forEach(sub => {
	let last_mod = new Date(sub.last_modified);
	let last_mod_month = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(last_mod);
	let tr = document.createElement('tr');
	tr.setAttribute('data-subscriptionId', sub.subscriptionId);
	tr.setAttribute('class', 'subscriptionRow');

	add_table_icons(tr, sub);

	let td1 = document.createElement('td');
	td1.setAttribute('class', 'td countryName');
	td1.innerText = sub.country;
	tr.appendChild(td1);
	let td2 = document.createElement('td');
	td2.setAttribute('class', 'td');
	td2.innerText = sub.post;
	tr.appendChild(td2);
	let td3 = document.createElement('td');
	td3.setAttribute('class', 'td');
	td3.innerText = sub.allowance;
	tr.appendChild(td3);
	let td4 = document.createElement('td');
	td4.setAttribute('class', 'td');
	td4.innerText = last_mod.getDate() + ' '
	    + last_mod_month + ' '
	    + last_mod.getFullYear();	    
	tr.appendChild(td4);

	if(rowNum === null){
	    tbody.appendChild(tr);
	}
	else{
	    tbody.insertBefore(tr, tbody.childNodes[rowNum - 1]);
	}
    })
}

/* name: add_table_icons
   description: place email, download, preview, and delete font awesome icons in
                this table tr row. Attach event listeners and necessary tokens and other
		values for event handles.
 */
function add_table_icons(tr, sub){
    //we are adding 2 tr inside tdMain, then two td inside each tr
    let tdMain = document.createElement('td');

    let tr1 = document.createElement('tr');
    let tr2 = document.createElement('tr');
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');
    let td3 = document.createElement('td');
    let td4 = document.createElement('td');

    tdMain.setAttribute('class', 'td tdButtons');
    
    
    //preview doc button
    let prevBtn = document.createElement('button');
    prevBtn.setAttribute('class', 'btn-clear');
    prevBtn.setAttribute('data-subscriptionId', sub.subscriptionId); 
    prevBtn.setAttribute('title', `Preview ${sub.country} (${sub.post}) document`);
    prevBtn.addEventListener('click', e => {
	e.preventDefault();
	template_preview(null, sub.tok);
    });
    let iPrev = document.createElement('i');
    iPrev.setAttribute('class', 'preview');
    prevBtn.appendChild(iPrev);
    td1.appendChild(prevBtn);

    //download doc button
    let downloadBtn = document.createElement('button');
    downloadBtn.setAttribute('class', 'btn-clear');
    downloadBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    downloadBtn.setAttribute('title', `Download ${sub.country} (${sub.post}) document`);
    let iDl = document.createElement('i');
    iDl.setAttribute('class', 'downloadSubscription');
    downloadBtn.appendChild(iDl);
    downloadBtn.addEventListener('click', e => {
	e.preventDefault();
	download_subscription(iDl, sub.tok, sub.post, sub.country);
    });
    td2.appendChild(downloadBtn);
    
    //delete button
    let delBtn = document.createElement('button');
    delBtn.setAttribute('class', 'btn-clear');
    delBtn.setAttribute('data-subscriptionId', sub.subscriptionId); 
    delBtn.setAttribute('title', `Delete ${sub.country} (${sub.post}) subscription`);
    let iDel = document.createElement('i');
    iDel.setAttribute('class', 'trashCan');
    delBtn.appendChild(iDel);
    delBtn.addEventListener('click', e => {
	e.preventDefault();
	delete_subscription(iDel, sub.tok, sub.post, sub.country, sub.subscriptionId);
    });
    td3.appendChild(delBtn);
    
    //fire off email button
    let emailBtn = document.createElement('button');
    emailBtn.setAttribute('class', 'btn-clear');
    emailBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    emailBtn.setAttribute('title', `Send email for this subscription: ${sub.country} (${sub.post}) now`);
    let iEmail = document.createElement('i');
    iEmail.setAttribute('class', 'email');
    emailBtn.appendChild(iEmail);
    emailBtn.addEventListener('click', e => {
	e.preventDefault();
	fire_subscription_email(iEmail, sub.tok, sub.post, sub.country);
    });
    td4.appendChild(emailBtn);


    tdMain.appendChild(tr1);
    tr1.appendChild(td1);
    tr1.appendChild(td2);

    tdMain.appendChild(tr2);
    tr2.appendChild(td3);
    tr2.appendChild(td4);
    
    tr.appendChild(tdMain);
}

/* name: update_table
   precondition: subscriptionId must is id of valid subscription in db
                 del is boolean. true means we will hide this elemnet from table, else display.
   postconditions: table has been search for subscription id and tr corresponding to
                   subscriptionId has been either hidden or deleted depending on del.
*/
function update_table(subscriptionId, del){
    let tbody = document.getElementById('subscriptionTbody');
    let trs = tbody.getElementsByTagName('tr');

    for(let i = 0; i < trs.length; i++){
	if(trs[i].getAttribute('data-subscriptionId') == subscriptionId){
	    if(del){
		trs[i].style.display = 'none';
	    }
	    else{
		trs[i].style.display = 'table-row';
	    }
	}
    }
}
