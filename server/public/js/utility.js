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
	let spinners = element.getElementsByClassName('fa fa-spinner fa-spin spinner');
	
	for(let i = 0; i < spinners.length; i++){
	    element.removeChild(spinners[i]);	
	}
    }
    catch(err){
	console.log("No spinner to remove");
	console.log(err);
    }
}
function show_popover(el, time=5000){
    el.popover('show');
    setTimeout((popel) => {
	popel.popover('dispose');
    }, time, el);
}
