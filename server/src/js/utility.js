document.addEventListener('DOMContentLoaded', () => {
    displayReturnToTop();
    displayBrowserWarning();
});

export function hiddenTimer(element, time = 5000) {
    setTimeout(() => {
        element.hidden = true;
    }, time);
}

export function classTimer(element, from, to, fin, time = null) {
    element.classList.remove(from);
    element.classList.add(to);

    if (time) {
        setTimeout(() => {
            element.classList.remove(to);
            element.classList.add(fin);
        }, time)
    }
}

export function showSpinner(element, lg = '', insertFirst = false) {
    let i = document.createElement('i');
    i.setAttribute('class', `fa fa-spinner fa-spin spinner${lg}`);
    if (insertFirst && element.firstChild) {
        element.insertBefore(i, element.firstChild);
    }
    else {
        element.appendChild(i);
    }
}

export function removeSpinner(element, lg = '') {
    try {
        let spinners = element.getElementsByClassName(`fa fa-spinner fa-spin spinner${lg}`);

        for (let i = 0; i < spinners.length; i++) {
            element.removeChild(spinners[i]);
        }
    }
    catch (err) {
        console.log("No spinner to remove");
        console.log(err);
    }
}

/* name: showPopover
   preconditions: el is a jquery object containing the element on which to show popover
   postconditions: popover with borderColor shown for time milliseconds
*/
export function showPopover(el, time = 5000, borderColor = 'rgba(0, 0, 0, 0.2') {
    $('.popover').css('border-color', borderColor);
    el.popover('show');
    setTimeout((popel) => {
        popel.popover('dispose');
    }, time, el);
}

export function setErrorBorder(el, time = 5000) {
    el.classList.add('errorBorder');
    setTimeout(el => {
        el.classList.remove('errorBorder');
    }, time, el)
}

/* name: scrollSave
   preconditions: arr is an array of elements for which we want to save the scroll x/y values
   postconditions: return an array of objects that contains references to each element along
                   with the saved scroll x/y values.
*/
export function scrollSave(arr) {
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

/* name: scrollRestore
   preconditions: arr is array of objects. Each object should be of format:
                    {element: element, scrollY: scrollY, scrollX: scrollX}. Best when
		    used in combination wiht scrollSave
   postconditions: scroll x/y values updated for all elements in arr
*/
export function scrollRestore(arr) {
    document.getElementsByTagName('html')[0].style.scrollBehavior = "auto";
    arr.forEach(el => {
        el.element.scrollTo(el.scrollX, el.scrollY);
    })
    document.getElementsByTagName('html')[0].style.scrollBehavior = "smooth";
}

export function addClasses(elements, classes) {
    for (let i = 0; i < elements.length; i++) {
        classes.forEach(cl => {
            elements[i].classList.add(cl);
        })
    }
}
export function removeClasses(elements, classes) {
    for (let i = 0; i < elements.length; i++) {
        classes.forEach(cl => {
            elements[i].classList.remove(cl);
        })
    }
}

export function hideElements(elements) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display= 'none';
    }
}

export function clearInnerText(elements) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].innerText = '';
    }
}

export function clearCanvas(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('light-border');
    canvas.height = '1rem';
}
export function displayReturnToTop() {
    let html = document.getElementsByTagName('html')[0];
    let body = document.getElementsByTagName('body')[0];

    if (html.clientHeight + 100 < body.clientHeight) {
        let rtt = document.getElementsByClassName('usa-footer__return-to-top')[0];
        rtt.style.display = 'block';
    }
}

export function displayBrowserWarning(){
    // https://medium.com/creative-technology-concepts-code/detect-device-browser-and-version-using-javascript-8b511906745
    var os = [
	{ name: 'Windows Phone', value: 'Windows Phone', version: 'OS' },
	{ name: 'Windows', value: 'Win', version: 'NT' },
	{ name: 'iPhone', value: 'iPhone', version: 'OS' },
	{ name: 'iPad', value: 'iPad', version: 'OS' },
	{ name: 'Kindle', value: 'Silk', version: 'Silk' },
	{ name: 'Android', value: 'Android', version: 'Android' },
	{ name: 'PlayBook', value: 'PlayBook', version: 'OS' },
	{ name: 'BlackBerry', value: 'BlackBerry', version: '/' },
	{ name: 'Macintosh', value: 'Mac', version: 'OS X' },
	{ name: 'Linux', value: 'Linux', version: 'rv' },
	{ name: 'Palm', value: 'Palm', version: 'PalmOS' }
    ];
    var browser = [
	{ name: 'Chrome', value: 'Chrome', version: 'Chrome' },
	{ name: 'Firefox', value: 'Firefox', version: 'Firefox' },
	{ name: 'Safari', value: 'Safari', version: 'Version' },
	{ name: 'Internet Explorer', value: 'MSIE', version: 'MSIE' },
	{ name: 'Opera', value: 'Opera', version: 'Opera' },
	{ name: 'BlackBerry', value: 'CLDC', version: 'CLDC' },
	{ name: 'Mozilla', value: 'Mozilla', version: 'Mozilla' }
    ];
    var header = [
	navigator.platform,
	navigator.userAgent,
	navigator.appVersion,
	navigator.vendor,
	window.opera
    ];

    var agent = header.join(' ');
    var os = matchItem(agent, os);
    var browser = matchItem(agent, browser);

    if(browser.name === 'Chrome' || browser.name === 'Firefox' || browser.name === "Safari"){
	document.getElementById("browserWarning").setAttribute("style", "display: none");
    }
    //special case for edge...
    if(navigator.userAgent.match("Edge")){
	document.getElementById("browserWarning").setAttribute("style", "display: none");
    }
    
    function matchItem(string, data) {
	var i = 0,
            j = 0,
            html = '',
            regex,
            regexv,
            match,
            matches,
            version;
	
	for (i = 0; i < data.length; i += 1) {
            regex = new RegExp(data[i].value, 'i');
            match = regex.test(string);
            if (match) {
		regexv = new RegExp(data[i].version + '[- /:;]([\d._]+)', 'i');
		matches = string.match(regexv);
		version = '';
		if (matches) { if (matches[1]) { matches = matches[1]; } }
		if (matches) {
                    matches = matches.split(/[._]+/);
                    for (j = 0; j < matches.length; j += 1) {
			if (j === 0) {
                            version += matches[j] + '.';
			} else {
                            version += matches[j];
			}
                    }
		} else {
                    version = '0';
		}
		return {
                    name: data[i].name,
                    version: parseFloat(version)
		};
            }
	}
	return { name: 'unknown', version: 0 };
    }
}

export function disableElements(elements) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = true;
    }
}
export function enableElements(elements) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = false;
    }
}
export function disableForm(form) {
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
        elements[i].disabled = true;
    }
}
export function enableForm(form) {
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
        elements[i].disabled = false;
    }
}

export function clientDownloadFile(res) {
    var a = document.createElement('a');

    //    var data = new File(new Uint8Array(res.file.data), res.filename);
    var uint8arr = new Uint8Array(res.file.data);
    var data = new Blob([uint8arr]);
    //    var data = new Blob(uint8arr);

    var url = window.URL.createObjectURL(data);
    a.href = url;
    a.download = res.filename;
    document.body.appendChild(a);

    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0)
}
/********************* table sorting methods *************************/
export function clearTableGroups(table){
    let tbody = table.getElementsByTagName('tbody');
    while(tbody.length > 0){
	tbody[0].remove();
    }
}

export function clearTableRows(table){
    let tbody = table.getElementsByTagName('tbody')[0];
    while(tbody.childNodes.length > 0){
	tbody.childNodes[0].remove();
    }
}

export function displayTableGroups(table, list){
    list.forEach(l => {
	table.appendChild(l.element);
	if(l.nextElement){
	    table.appendChild(l.nextElement);
	}
    })
}
export function displayTableRows(table, list){
    let tbody = table.getElementsByTagName('tbody')[0];
    list.forEach(l => {
	tbody.appendChild(l.element);
	if(l.nextElement){
	    tbody.appendChild(l.nextElement);
	}
    })
}

export function removeSortClasses(elements){
    for(let i = 0; i < elements.length; i++){
	elements[i].classList.remove('sort', 'sortedUp', 'sortedDown');
	elements[i].classList.add('sort');
    }
}

export function insertionSort(list, asc=true){
    
    let element;
    let key;
    let j;
    let temp;
    
    for(let i = 1; i < list.length; i++){
	key = list[i].value;
	j = i;

	if(asc){
	    while(j > 0 && key < list[j - 1].value){
		j--;
	    }
	}
	else{
	    while(j > 0 && key > list[j - 1].value){
		j--;
	    }
	}
	element = list[i];
	list.splice(i, 1);
	list.splice(j, 0, element);
	
    }
}

/* Call this method after DOMContentLoaded to force user browser
   to download all icons used in css background images.
   There has been an issue with mobile browsers not downloading
   icons on demand.
*/
export function downloadIcons(){
    let cache = document.getElementById('iconCache');
    
    let classList = ['downloadSubscription',
		     'downloadSubscriptionError',
		     'downloadSubscriptionSuccess',
		     'downloadSubscriptionSecondary',
		     'downloadSubscriptionLg',
		     'downloadSubscriptionErrorLg',
		     'downloadSubscriptionSuccessLg',
		     'downloadSubscriptionSecondaryLg',
		     'email',
		     'emailSuccess',
		     'emailError',
		     'preview',
		     'previewSecondary',
		     'trashCan',
		     'trashCanSecondary'];
    
    classList.forEach(cl => {
	let i = document.createElement('i');
	i.classList.add(cl);
	cache.appendChild(i);
    });
}