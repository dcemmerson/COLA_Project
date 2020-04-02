const LINESPACING = 10;
document.addEventListener('DOMContentLoaded', async () => {
    let subscription_list = await fetch_user_subscription_list();

    set_window_prefs();
    initialize_form();
    $('#subscribeAdditional').on('click', () => {
	hide_elements($('.alert'));
	$('#infoContainer')[0].style.display = "block";
	$('#subscriptionFormContainer')[0].style.display = "block";
    })
});
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
    let size = $('#subscriptionsTable')[0].clientHeight;

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
/*
function new_subscription_success(post_id){
    let msg_div = document.getElementById('addSubscriptionMessageDiv');

    let pop = $('#submitNewSubscription');
    
    for (let [num, option] of Object.entries($('#searchPosts option'))) {
	if(option.getAttribute('data-COLARatesId') == post_id){
	    pop[0].setAttribute('data-content', `New subscription added: ${option.innerText}`);
	    show_popover(pop, 4000, 'green')
	    return;
	}
    }
}
*/

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
//    let postVal = $('.postVal');
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
	$('#uploadTemplateErrorMsg')[0].style.display = 'none';
	$('#previousTemplateErrorMsg')[0].style.display = 'none';
    }
    
    
    return valid;
}

function validate_subscription_old(){
    console.log('val called');
    let valid = false;
    const posts = document.getElementById('searchPosts');
    const upTemp = document.getElementById('uploadTemplate');
    const prevTemp = document.getElementById('choosePreviousTemplate');
    let buttonPop = document.getElementById('submitNewSubscription');
    
    let reg = /(\.doc|\.docx)$/i;
    
    if(posts.selectedIndex === 0){
	buttonPop.setAttribute('data-content', '1. Must select a post.');
	set_error_border(posts);
    }
    else if(!upTemp.value && prevTemp.selectedIndex === 0){
	buttonPop.setAttribute('data-content', '2. Must choose a template.');
	set_error_border(upTemp);
	set_error_border(prevTemp);
    }
    else if(!reg.exec(upTemp.value)
	    && !reg.exec(prevTemp[prevTemp.selectedIndex].value)){
		//check if ending of file is not .doc or .doc
	buttonPop.setAttribute('data-content', 'Unsupported file type');
	if(upTemp.value) set_error_border(upTemp);
	else if(prevTemp.value) set_error_border(prevTemp);
    }
    else{ //otherwise the post/file combo looks fine to upload
	valid = true;
    }

    if(!valid){
	let pop = $('#submitNewSubscription');
	show_popover(pop, 4000, 'red');
    }
    return valid;
}

function display_unsubscribe_alert(element, post, country, tok){
    element.getElementsByClassName('unsubscribeMsgSpan')[0].innerText = `${country} (${post})`;
    element.style.display = 'block';
    
    $('#undoLink')[0].setAttribute('data-tok', tok);
    $('#undoLink')[0].setAttribute('data-post', post);
    $('#undoLink')[0].setAttribute('data-country', country);
    
    $('#undoLink')[0].removeEventListener('click', restore_subscription);    
    $('#undoLink')[0].addEventListener('click', restore_subscription);
}

function restore_subscription(e){
    e.preventDefault();
    console.log($('#undoLink')[0].getAttribute('data-tok'));
    let undoLink = $('#undoLink')[0];
    
    delete_subscription(undoLink.getAttribute('data-tok'),
			undoLink.getAttribute('data-post'),
			undoLink.getAttribute('data-country'));
			
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
