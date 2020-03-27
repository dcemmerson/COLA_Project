
const LINESPACING = 10;
document.addEventListener('DOMContentLoaded', async () => {
    let subscription_list = fetch_user_subscription_list();

    await subscription_list;
    set_window_prefs();
    initialize_form();
    $('#subscribeAdditional').on('click', () => {
	$('#successContainer')[0].style.display = "none";
	$('#addSubscription')[0].style.display = "block";
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
}


function new_subscription_success(postId){
    let subscribeContainer = $('#subscribeContainer')[0];
    let successContainer = $('#successContainer')[0];
    subscribeContainer.style.display = 'none';
    successContainer.style.display = 'block';

	/////////////// find which post this postId corresponds to ////////////////
    for (let [num, option] of Object.entries($('#postSelect option'))) {
	if(option.getAttribute('data-COLARatesId') == postId){
	    $('#subscribedSpan')[0].innerText = option.innerText;
	    return;
	}
    }
    
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
function validate_subscription_soft(){
    const postVal = $('#postVal')[0];
    const postSelect = $('#postSelect')[0];

    const tempVal = $('#templateVal')[0];
    const tempSelect = $('#templateSelect')[0];
    const tempUp = $('#uploadTemplate')[0];
    
    let reg = /(\.doc|\.docx)$/i;

    //////////////////// check for selected post ///////////////////
    if(postSelect.selectedIndex === 0){
	postVal.classList.remove('val');
	postVal.classList.add('invalBlank');
    }
    else{
	postVal.classList.remove('invalBlank');
	postVal.classList.add('val');
	postSelect.classList.remove('usa-input--error');
    }

    ////////////////// check for template /////////////////
    if(!tempUp.value && tempSelect.selectedIndex === 0){
	tempVal.classList.remove('val');
	tempVal.classList.add('invalBlank');
    }
    else{
	tempVal.classList.remove('invalBlank');
	tempVal.classList.add('val');
	tempUp.classList.remove('usa-input--error');
	tempSelect.classList.remove('usa-input--error');
//	$('#templateGroup')[0].classList.remove('usa-input--error');
    }
}
/* name: initialize_form
   preconditions: subscription html DOM content has loaded
   postcondition: if user refreshed page and has a template still selected,
                  check if that template is of type doc/docx. If not, then
		  highlight it with red border and place x in alert box.
*/
function initialize_form(){
    let tempVal = $('#templateVal')[0];
    let upTemp = $('#uploadTemplate')[0];
    let prevTemp = $('#templateSelect')[0];

    const reg = /(\.doc|\.docx)$/i;
    
    if(upTemp.value && !reg.exec(upTemp.value)){
	//ending of file is not .doc or .doc
	tempVal.classList.remove('val', 'invalBlank');
	tempVal.classList.add('invalid');
	upTemp.classList.add('usa-input--error');
    }
    else if(prevTemp.selectedIndex !== 0
	    && !reg.exec(prevTemp[prevTemp.selectedIndex].value)){
	//ending of file is not .doc or .doc
	tempVal.classList.remove('val', 'invalBlank');
	tempVal.classList.add('invalid');
	prevTemp.classList.add('usa-input--error');
    }
}
function validate_subscription(submit=false){
    let valid = false;
    let valAlert = $('#valAlert')[0];
    let postVal = $('#postVal')[0];
    let tempVal = $('#templateVal')[0];
    let postSelect = $('#postSelect')[0];
    let upTemp = $('#uploadTemplate')[0];
    let prevTemp = $('#templateSelect')[0];
    
    const reg = /(\.doc|\.docx)$/i;

    //////////////////// check for selected post ///////////////////
    if(postSelect.selectedIndex === 0){
	postVal.classList.remove('val');
	postVal.classList.add('invalBlank');
	if(submit) postSelect.classList.add('usa-input--error');
    }
    else{
	postVal.classList.remove('invalBlank');
	postVal.classList.add('val');
	postSelect.classList.remove('usa-input--error');

	valid = true;
    }

    ////////////////// check for template - ensure doc/docx ending ///////
    if(!upTemp.value && prevTemp.selectedIndex === 0){
	tempVal.classList.remove('val', 'invalid');
	tempVal.classList.add('invalBlank');
	if(submit){
	    upTemp.classList.add('usa-input--error');
	    prevTemp.classList.add('usa-input--error');
	}
	valid = false;
    }
    else if(!reg.exec(upTemp.value)
	    && !reg.exec(prevTemp[prevTemp.selectedIndex].value)){
	//ending of file is not .doc or .doc
	tempVal.classList.remove('val', 'invalBlank');
	tempVal.classList.add('invalid');
	if(submit){
	    valAlert.classList.remove('usa-alert--info');
	    valAlert.classList.add('usa-alert--warning');
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
	tempVal.classList.remove('invalBlank', 'invalid');
	tempVal.classList.add('val');
	upTemp.classList.remove('usa-input--error');
	prevTemp.classList.remove('usa-input--error');
	valid = valid && true;
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

