const LINESPACING = 10;
document.addEventListener('DOMContentLoaded', async () => {
    let subscription_list = fetch_user_subscription_list();

    await subscription_list;
    set_window_prefs();
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

function hidden_timer(element){
    setTimeout(() => {
	element.hidden = true;
    }, 3000);
}
function show_spinner(element){
    let i = document.createElement('i');
    i.setAttribute('class', 'fa fa-spinner fa-spin spinner');
    element.appendChild(i);
}
function remove_spinner(element){
    try{
//	element.removeChild(element.getElementsByClassName('i fa fa spinner fa-spin spinner')[0]);
	let spinners = element.getElementsByClassName('fa fa-spinner fa-spin spinner');
//	spinners.forEach(el => element.removeChild(el));
	
	for(let i = 0; i < spinners.length; i++){
	    element.removeChild(spinners[i]);	
	}
    }
    catch(err){
	console.log("No spinner to remove");
	console.log(err);
    }
}

function new_subscription_success(post_id){
    let msg_div = document.getElementById('addSubscriptionMessageDiv');

    for (let [num, option] of Object.entries($('#searchPosts option'))) {
	if(option.getAttribute('data-COLARatesId') == post_id){
	    msg_div.innerText = 'New subscription created: '
		+ option.innerText;
	    msg_div.setAttribute('class', 'successMessage');
	    msg_div.hidden = false;
	    hidden_timer(msg_div)
	    return;
	}
    }
}
