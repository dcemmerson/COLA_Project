document.addEventListener('DOMContentLoaded', () => {
    let mainContainer = document.getElementById('mainContainer');
    
    document.getElementById('buttonRight').addEventListener('click', e => {
	e.preventDefault();
	mainContainer.classList.remove('slideLeft');
	mainContainer.classList.add('slideRight');
    });
    document.getElementById('buttonLeft').addEventListener('click', e => {
	e.preventDefault();
	mainContainer.classList.remove('slideRight');
	mainContainer.classList.add('slideLeft');
    });

})

function expand(element){
    let ariaExp = element.getAttribute('aria-expanded');
    if(ariaExp === "true"){
	element.setAttribute('aria-expanded', false);
    }
    else{
	element.setAttribute('aria-expanded', true);
    }
}

function sortRows(table, element, sortCol){
    let userRows = table.getElementsByClassName('userRow');
    let list = constructRowObjects(userRows, sortCol);

    if(element.classList.contains('sortedUp')){
	insertionSort(list, false);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByTagName('span'));
	element.classList.remove('sort');
	element.classList.add('sortedDown');
    }
    else{
	insertionSort(list, true);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByTagName('span'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
    }

    clearTable(table);
    displayTable(table, list);
    
}

function sortGroups(table, element, sortCol){
    let userGroups = document.getElementsByClassName('userGroup');
    let list = constructGroupObjects(table.getElementsByTagName('tbody'), sortCol);

    if(element.classList.contains('sortedUp')){
	insertionSort(list, false);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByTagName('span'));
	element.classList.remove('sort');
	element.classList.add('sortedDown');
    }
    else{
	insertionSort(list, true);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByTagName('span'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
    }

    clearTable(table);
    displayTable(table, list);
    
}

function insertionSort(list, asc=true){
    
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
function clearTable(table){
    let tbody = table.getElementsByTagName('tbody');
    while(tbody.length > 0){
	tbody[0].remove();
    }
    
}

function constructRowObjects(trs, sortElement){
    let list = [];
    let val;

    for(let i = 0; i < trs.length; i++){
	val = trs[i].getElementsByTagName('td')[sortElement].getAttribute('data-value');
	list.push({
	    element: trs[i],
	    value: parseInt(val) ? parseInt(val) : val
	    // val could be a string or number and need to sort accordingly
	});
    }
    return list;
}

function constructGroupObjects(tbody, sortElement){
    let list = [];
    let val;
    for(let i = 0; i < tbody.length; i += 2){
	let val = tbody[i].getElementsByClassName('userRow')[0].getElementsByTagName('td')[sortElement].getAttribute('data-value');
	list.push({
	    element: tbody[i],
	    nextElement: tbody[i + 1],
	    value: parseInt(val) ? parseInt(val) : val
	    // val could be a string or number and need to sort accordingly
	});
    }
    
    return list;
}

function displayTable(table, list){
    list.forEach(l => {
	table.appendChild(l.element);
	if(l.nextElement){
	    table.appendChild(l.nextElement);
	}
    })
}

function removeSortClasses(elements){
    for(let i = 0; i < elements.length; i++){
	elements[i].classList.remove('sort', 'sortedUp', 'sortedDown');
	elements[i].classList.add('sort');
    }
}
