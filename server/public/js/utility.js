function hidden_timer(element, time=5000){
    setTimeout(() => {
	element.hidden = true;
    }, time);
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

function set_error_border(el, time=5000){
    el.classList.add('errorBorder');
    setTimeout(el => {
	el.classList.remove('errorBorder');
    }, time, el)
}

/* name: scroll_save
   preconditions: arr is an array of elements for which we want to save the scroll x/y values
   postconditions: return an array of objects that contains references to each element along
                   with the saved scroll x/y values.
*/
function scroll_save(arr){
    var context = []
    arr.forEach(el => {
	context.push({
	    element: el,
	    scrollY: el.scrollTop,
	    scrollX: el.scrollLeft
	});
    });
    return context;
}

/* name: scroll_restore
   preconditions: arr is array of objects. Each object should be of format:
                    {element: element, scrollY: scrollY, scrollX: scrollX}. Best when
		    used in combination wiht scroll_save
   postconditions: scroll x/y values updated for all elements in arr
*/
function scroll_restore(arr){
    document.getElementsByTagName('html')[0].style.scrollBehavior = "auto";
    arr.forEach(el => {
	el.element.scrollTo(el.scrollX, el.scrollY);
    })
    document.getElementsByTagName('html')[0].style.scrollBehavior = "smooth";
}
function add_classes(elements, classes){
    for(let i = 0; i < elements.length; i++){
	classes.forEach(cl => {
	    elements[i].classList.add(cl);
	})
    }
}
function remove_classes(elements, classes){
    for(let i = 0; i < elements.length; i++){
	classes.forEach(cl => {
	    elements[i].classList.remove(cl);
	})
    }
}

function hide_elements(elements){
    for(let i = 0; i < elements.length; i++){
	elements[i].style.display = 'none';
    }
}
function clear_inner_text(elements){
    for(let i = 0; i < elements.length; i++){
	elements[i].innerText = '';
    }
}
