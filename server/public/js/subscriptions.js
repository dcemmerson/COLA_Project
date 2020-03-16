document.addEventListener('DOMContentLoaded', () => {
    fetch_user_subscription_list();
    

});

async function fetch_user_subscription_list(){
    try{
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
    }
    catch(err) {
	console.log(err);
    }
}

function clear_user_subscriptions(){
    let tbody = document.getElementById('subscriptionTbody');
    while(tbody.firstChild)
	tbody.removeChild(tbody.firstChild);
}
function delete_subscription(){
    console.log(this);
    //   fetch('/get_user_subscription_list')
    
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
    element.removeChild($('i.fa.fa-spinner.fa-spin.spinner')[0]);
}
