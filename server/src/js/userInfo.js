import * as utility from './utility.js';

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

    addSortEventListeners();
    addGroupTableEventListeners();
})

function addGroupTableEventListeners(){
    let userGroups = document.getElementsByClassName('userGroup');

    Object.values(userGroups).forEach(group => {
	group.addEventListener('click', () => expand(group));
    });
}

function addSortEventListeners(){
    let groupTable = document.getElementsByClassName('userGroupTable')[0];
    let icons = groupTable.getElementsByClassName('sortIcon');
    
    Object.values(icons).forEach((el, ind) => {
	el.addEventListener('click', () => {
	    sortGroups(groupTable, el, ind);
	});
    });

    let rowTable = document.getElementsByClassName('userRowTable')[0];
    icons = rowTable.getElementsByClassName('sortIcon');
    
    Object.values(icons).forEach((el, ind) => {
	el.addEventListener('click', () => {
	    sortRows(rowTable, el, ind);
	});
    });
}

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
	utility.insertionSort(list, false);
	utility.removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedDown');
    }
    else{
	utility.insertionSort(list, true);
	utility.removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
    }

    utility.clearTableRows(table);
    utility.displayTableRows(table, list);
    
}

function sortGroups(table, element, sortCol){
    let userGroups = document.getElementsByClassName('userGroup');
    let list = constructGroupObjects(table.getElementsByTagName('tbody'), sortCol);

    if(element.classList.contains('sortedUp')){
	utility.insertionSort(list, false);
	utility.removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedDown');
    }
    else{
	utility.insertionSort(list, true);
	utility.removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
    }

    utility.clearTableGroups(table);
    utility.displayTableGroups(table, list);
    
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

