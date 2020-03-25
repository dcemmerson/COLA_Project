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

/* name: show_popover
   preconditions: el is a jquery object containing the element on which to show popover
   postconditions: popover with borderColor shown for time milliseconds
*/
function show_popover(el, time=5000, borderColor='rgba(0, 0, 0, 0.2'){
    $('.popover').css('border-color', borderColor);
    el.popover('show');
    setTimeout((popel) => {
	popel.popover('dispose');
    }, time, el);
}

function set_error_border(el){
    el.classList.add('errorBorder');
    setTimeout(el => {
	el.classList.remove('errorBorder');
    }, 3500, el)
}
