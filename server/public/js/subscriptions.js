const LINESPACING = 10;
document.addEventListener('DOMContentLoaded', async () => {
    let subscriptionList = await fetchUserSubscriptionList();

    initializeForm();
    document.getElementById('subscribeAdditional').addEventListener('click', () => {
        hideElements($('.alert'));
        document.getElementById('infoContainer').style.display = "block";
        document.getElementById('subscriptionFormContainer').style.display = "block";
    });

    document.getElementById('previewPrevTemplate').addEventListener('click', e => {
        e.preventDefault();
        let tempSelect = document.getElementById('templateSelect');
        let templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

        if (validPreview()) {
            templatePreview(templateId);
        }
    });

    document.getElementById('downloadPrevTemplate').addEventListener('click', async function (e) {
        e.preventDefault();
        let tempSelect = document.getElementById('templateSelect');
        let templateId = tempSelect[tempSelect.selectedIndex].getAttribute('data-templateId');

        if (validPreview(true)) {
            this.disabled = true;
            await templateDownload(templateId);
            this.disabled = false;

        }
    });

    //when user exits modal, reset modal to be ready to user to preview
    //another template
    $('#previewTemplateModal').on('hidden.bs.modal', () => {
        clearCanvas(document.getElementById('previewCanvas'));
        document.getElementById('previewTemplateLabel').innerText = "";
    });

});

function pdfToCanvas(uint8arr) {
    return new Promise((resolve, reject) => {
        var loadingTask = pdfjsLib.getDocument(uint8arr);
        loadingTask.promise.then(function (pdf) {
            pdf.getPage(1)
                .then(function (page) {
                    var scale = 1;
                    var viewport = page.getViewport({ scale: scale });

                    var canvas = document.getElementById('previewCanvas');
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                    resolve();

                })
                .catch(err => {
                    console.log(err);
                    reject("Error generating preview");
                })
        });
    })
}

function clearUserSubscriptions() {
    let tbody = document.getElementById('subscriptionTbody');
    while (tbody.firstChild)
        tbody.removeChild(tbody.firstChild);

    document.getElementById('subscriptionsTable').style.display = 'none';
    document.getElementById('noActiveSubscriptions').style.display = 'none';

}

function clearDropdown(dropdown) {
    while (dropdown.firstChild) {
        dropdown.removeChild(dropdown.firstChild);
    }
}

function newSubscriptionSuccess(postId) {
    hideElements(document.getElementsByClassName('alert'));
    hideElements([document.getElementById('subscriptionFormContainer')]);
    let successContainer = document.getElementById('successContainer');
    successContainer.style.display = 'block';

    /////////////// find which post this postId corresponds to ////////////////
    for (let [num, option] of Object.entries($('#postSelect option'))) {
        if (option.getAttribute('data-COLARatesId') == postId) {
            document.getElementById('successSpan').innerText = option.innerText;
            return;
        }
    }
}

/* name: initializeForm
   preconditions: subscription html DOM content has loaded
   postcondition: if user refreshed page and has a template still selected,
   check if that template is of type doc/docx. If not, then
   highlight it with red border and place x in alert box.
   We didn't use refresh flag on window to ensure there is
   no browser incapatability, as not running this initial
   validation check could cause user confusion if they
   refresh page.
*/
function initializeForm() {
    let tempVal = document.getElementsByClassName('templateVal');
    let upTemp = document.getElementById('uploadTemplate');
    let prevTemp = document.getElementById('templateSelect');

    const reg = /(\.doc|\.docx)$/i;
    // check if there is a template selected, if so, run
    // post validation, otherwise don't and just leave checkmarks
    // on alert validation to help user understand the alert is responsive
    if (upTemp.value && !reg.exec(upTemp.value)) {
        //ending of file is not .doc or .doc
        removeClasses(tempVal, ['val', 'invalBlank']);
        addClasses(tempVal, ['invalid']);
        upTemp.classList.add('usa-input--error');
        validatePost();
    }
    else if (prevTemp.selectedIndex !== 0
        && !reg.exec(prevTemp[prevTemp.selectedIndex].value)) {
        //ending of file is not .doc or .doc
        removeClasses(tempVal, ['val', 'invalBlank']);
        addClasses(tempVal, ['invalid']);
        prevTemp.classList.add('usa-input--error');
        validatePost();
    }
}

function validPreview(download = false) {
    let prevTemp = document.getElementById('templateSelect');
    document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
    document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
    document.getElementById('downloadTemplateSpan').classList.remove('downloadSuccess', 'downloadError');

    if (prevTemp.selectedIndex === 0) {
        prevTemp.classList.add('usa-input--error');
        if (download) {
            document.getElementById('previousTemplateErrorMsgDownload').style.display = 'block';
        }
        else {
            document.getElementById('previousTemplateErrorMsgPreview').style.display = 'block';
        }
        return false;
    }
    else {
        prevTemp.classList.remove('usa-input--error');
        return true;
    }
}
function validatePost(submit = false) {
    let postVals = document.getElementsByClassName('postVal');
    let postSelect = document.getElementById('postSelect');

    //////////////////// check for selected post ///////////////////
    if (postSelect.selectedIndex === 0) {
        removeClasses(postVals, ['val']);
        addClasses(postVals, ['invalBlank']);
        var valid = false;
        if (submit) postSelect.classList.add('usa-input--error');
    }
    else {
        removeClasses(postVals, ['invalBlank']);
        addClasses(postVals, ['val']);
        postSelect.classList.remove('usa-input--error');

        var valid = true;
    }
    return valid;
}
function validateSubscription(submit = false) {
    let valid = false;
    let tempVals = document.getElementsByClassName('templateVal');
    let upTemp = document.getElementById('uploadTemplate');
    let prevTemp = document.getElementById('templateSelect');

    const reg = /(\.doc|\.docx)$/i;
    valid = validatePost(submit);

    ////////////////// check for template - ensure doc/docx ending ///////
    if (!upTemp.value && prevTemp.selectedIndex === 0) {
        removeClasses(tempVals, ['val', 'invalid']);
        addClasses(tempVals, ['invalBlank']);

        if (submit) {
            upTemp.classList.add('usa-input--error');
            prevTemp.classList.add('usa-input--error');
        }
        valid = false;
    }
    else if (!reg.exec(upTemp.value)
        && !reg.exec(prevTemp[prevTemp.selectedIndex].value)) {
        //ending of file is not .doc or .doc
        removeClasses(tempVals, ['val', 'invalBlank']);
        addClasses(tempVals, ['invalid']);

        if (submit) {
            document.getElementById('infoContainer').style.display = 'none';
            document.getElementById('warningContainer').style.display = 'block';
        }

        if (upTemp.value) {
            upTemp.classList.add('usa-input--error');
        }
        else if (prevTemp.value) {
            prevTemp.classList.add('usa-input--error');
        }
        valid = false;
    }
    else { //everything looks okay
        removeClasses(tempVals, ['invalBlank', 'invalid']);
        addClasses(tempVals, ['val']);

        upTemp.classList.remove('usa-input--error');
        prevTemp.classList.remove('usa-input--error');
        valid = valid && true;
        document.getElementById('uploadTemplateErrorMsg').style.display = 'none';
        document.getElementById('previousTemplateErrorMsg').style.display = 'none';
        document.getElementById('previousTemplateErrorMsgPreview').style.display = 'none';
        document.getElementById('previousTemplateErrorMsgDownload').style.display = 'none';
    }


    return valid;
}

function displayUnsubscribeAlert(element, post, country, tok, subscriptionId) {
    element.getElementsByClassName('unsubscribeMsgSpan')[0].innerText = `${country} (${post})`;
    element.style.display = 'block';

    $('#undoLink')[0].setAttribute('data-tok', tok);
    $('#undoLink')[0].setAttribute('data-post', post);
    $('#undoLink')[0].setAttribute('data-country', country);
    $('#undoLink')[0].setAttribute('data-subscriptionId', subscriptionId);

    $('#undoLink')[0].removeEventListener('click', restoreSubscription);
    $('#undoLink')[0].addEventListener('click', restoreSubscription);

}

function restoreSubscription(e) {
    e.preventDefault();

    let undoLink = document.getElementById('undoLink');

    deleteSubscription(null, undoLink.getAttribute('data-tok'),
        undoLink.getAttribute('data-post'),
        undoLink.getAttribute('data-country'),
        undoLink.getAttribute('data-subscriptionId'));

}

function checkEmptySubscriptions() {
    let table = document.getElementById('subscriptionsTable');
    let tbody = document.getElementById('subscriptionTbody');
    let msgDiv = document.getElementById('noActiveSubscriptions');
    let isVisibleRow = false;

    //iterate through table to check if there are any visible rows
    tbody.childNodes.forEach(row => {
        if (row.style.display !== "none") isVisibleRow = true;
    })

    if (!isVisibleRow) {
        table.style.display = 'none';
        msgDiv.style.display = 'block';
    }
    else {
        table.style.display = 'table';
        msgDiv.style.display = 'none';
    }
}

function dismissAlert(alert) {
    alert.style.display = 'none';
    document.getElementById('unsubscribeAlertBlank').style.display = 'block';
}
function populateTemplateDropdown(dropdown, templates) {
    var option = document.createElement('option');
    dropdown.appendChild(option);

    templates.forEach(template => {
        option = document.createElement('option');
        option.setAttribute('data-templateId', template.id);
        option.innerText = template.name;

        dropdown.appendChild(option);
    })
}

function addSubscriptionToTable(sub) {
    let trs = document.getElementById('subscriptionTbody')
	.getElementsByClassName('subscriptionRow');

    populateSubscriptionTable({subscriptionList: [sub]});
    sortRows(document.getElementById('subscriptionsTable'));
}

function checkPreviousAllowance99() {
    let prevs = document.getElementsByClassName('prevAllowance');
    for (let i = 0; i < prevs.length; i++) {
        if (prevs[i].innerText.match('n/a') && prevs[i].parentElement.style.display !== "none") {
            document.getElementById('prevAllowanceWarning').style.display = 'flow';
            return;
        }
    }

    document.getElementById('prevAllowanceWarning').style.display = 'none';
}
function populateSubscriptionTable(res, rowNum = null) {
    let tbody = document.getElementById('subscriptionTbody');
    res.subscriptionList.forEach(sub => {
	
        let tr = document.createElement('tr');
        tr.setAttribute('data-subscriptionId', sub.subscriptionId);
        tr.setAttribute('class', 'subscriptionRow');

        addTableIcons(tr, sub);

        let td1 = document.createElement('td');
        td1.setAttribute('class', 'td countryName tdCell');
	td1.setAttribute('data-value', sub.country);
        td1.innerText = sub.country;
        tr.appendChild(td1);
        let td2 = document.createElement('td');
        td2.setAttribute('class', 'td postName tdCell');
	td2.setAttribute('data-value', sub.post);
        td2.innerText = sub.post;
        tr.appendChild(td2);
        let td3 = document.createElement('td');
        td3.setAttribute('class', 'td prevAllowance tdCell');
	td3.setAttribute('data-value', sub.prevAllowance);
        td3.innerText = sub.prevAllowance + '%';
        tr.appendChild(td3);

        if (sub.prevAllowance === -99) {
            td3.innerText = 'n/a';
            let sup = document.createElement('sup');
            sup.innerText = '*';
            td3.appendChild(sup);
        }


        let td4 = document.createElement('td');
        td4.setAttribute('class', 'td tdCell');
	td4.setAttribute('data-value', sub.allowance);
        td4.innerText = sub.allowance + '%';
        tr.appendChild(td4);

        let td5 = document.createElement('td');
        td5.setAttribute('class', 'td tdCell');
	td5.setAttribute('data-value', Date.parse(new Date(sub.effectiveDate)));
        td5.innerText = sub.effectiveDate;

        tr.appendChild(td5);

        if (rowNum === null) {
            tbody.appendChild(tr);
        }
        else {
            tbody.insertBefore(tr, tbody.childNodes[rowNum - 1]);
        }
    })

    checkPreviousAllowance99();
}

/* name: addTableIcons
   description: place email, download, preview, and delete font awesome icons in
                this table tr row. Attach event listeners and necessary tokens and other
		values for event handles.
*/
function addTableIcons(tr, sub) {
    //we are adding 2 tr inside tdMain, then two td inside each tr
    let tdMain = document.createElement('td');

    let tr1 = document.createElement('tr');
    let tr2 = document.createElement('tr');
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');
    let td3 = document.createElement('td');
    let td4 = document.createElement('td');

    tdMain.setAttribute('class', 'td tdButtons');


    //preview doc button
    let prevBtn = document.createElement('button');
    prevBtn.setAttribute('class', 'btn-clear');
    prevBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    prevBtn.setAttribute('title', `Preview ${sub.country} (${sub.post}) document`);
    prevBtn.addEventListener('click', e => {
        e.preventDefault();
        templatePreview(null, sub.tok);
    });
    let iPrev = document.createElement('i');
    iPrev.setAttribute('class', 'preview');
    prevBtn.appendChild(iPrev);
    td1.appendChild(prevBtn);

    //download doc button
    let downloadBtn = document.createElement('button');
    downloadBtn.setAttribute('class', 'btn-clear');
    downloadBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    downloadBtn.setAttribute('title', `Download ${sub.country} (${sub.post}) document`);
    let iDl = document.createElement('i');
    iDl.setAttribute('class', 'downloadSubscription');
    downloadBtn.appendChild(iDl);
    downloadBtn.addEventListener('click', e => {
        e.preventDefault();
        downloadSubscription(iDl, sub.tok, sub.post, sub.country);
    });
    td2.appendChild(downloadBtn);

    //delete button
    let delBtn = document.createElement('button');
    delBtn.setAttribute('class', 'btn-clear');
    delBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    delBtn.setAttribute('title', `Delete ${sub.country} (${sub.post}) subscription`);
    let iDel = document.createElement('i');
    iDel.setAttribute('class', 'trashCan');
    delBtn.appendChild(iDel);
    delBtn.addEventListener('click', e => {
        e.preventDefault();
        deleteSubscription(iDel, sub.tok, sub.post, sub.country, sub.subscriptionId);
    });
    td3.appendChild(delBtn);

    //fire off email button
    let emailBtn = document.createElement('button');
    emailBtn.setAttribute('class', 'btn-clear');
    emailBtn.setAttribute('data-subscriptionId', sub.subscriptionId);
    emailBtn.setAttribute('title', `Send email for this subscription: ${sub.country} (${sub.post}) now`);
    let iEmail = document.createElement('i');
    iEmail.setAttribute('class', 'email');
    emailBtn.appendChild(iEmail);
    emailBtn.addEventListener('click', e => {
        e.preventDefault();
        fireSubscriptionEmail(iEmail, sub.tok, sub.post, sub.country);
    });
    td4.appendChild(emailBtn);


    tdMain.appendChild(tr1);
    tr1.appendChild(td1);
    tr1.appendChild(td2);

    tdMain.appendChild(tr2);
    tr2.appendChild(td3);
    tr2.appendChild(td4);

    tr.appendChild(tdMain);
}

/* name: updateTable
   precondition: subscriptionId must is id of valid subscription in db
                 del is boolean. true means we will hide this elemnet from table, else display.
   postconditions: table has been search for subscription id and tr corresponding to
                   subscriptionId has been either hidden or deleted depending on del.
*/
function updateTable(subscriptionId, del) {
    let tbody = document.getElementById('subscriptionTbody');
    let trs = tbody.getElementsByTagName('tr');

    for (let i = 0; i < trs.length; i++) {
        if (trs[i].getAttribute('data-subscriptionId') == subscriptionId) {
            if (del) {
                trs[i].style.display = 'none';
            }
            else {
                trs[i].style.display = 'table-row';
            }
        }
    }
}

function sortRows(table, element=null, sortCol=null){
    // Use static class to keep track of sortCol and direction.
    // Necessary to sort table correctly when user adds new subscription.
    if(sortCol !== null){ // sort request is coming from user
	sortColG = sortCol;
    }

    let userRows = table.getElementsByClassName('subscriptionRow');
    let list = constructRowObjects(userRows, sortColG);

    if(sortCol !== null && element !== null && element.classList.contains('sortedDown')){
	insertionSort(list, true);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
	sortAscG = true;
    }
    else if(sortCol !== null && element !== null && element.classList.contains('sortedUp')){
	insertionSort(list, false);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedDown');
	sortAscG = false;
    }
    else if(sortCol !== null && element !== null){
	// Then we need to sort ascending - user did not just re-sort by this column.
	insertionSort(list, true);
	removeSortClasses(table.getElementsByClassName('thead')[0].getElementsByClassName('sortIcon'));
	element.classList.remove('sort');
	element.classList.add('sortedUp');
	sortAscG = false;
    }
    else{
	// This method was triggered by user creating new subscription and we
	// just need to resort the list in the same order it's already sorted
	insertionSort(list, sortAscG);
    }

    clearTableRows(table);
    displayTableRows(table, list);
}

function constructRowObjects(trs, sortCol){
    let list = [];
    let val;

    for(let i = 0; i < trs.length; i++){
	val = trs[i].getElementsByClassName('tdCell')[sortCol].getAttribute('data-value');
	list.push({
	    element: trs[i],
	    value: parseInt(val) ? parseInt(val) : val.toLowerCase()
	    // val could be a string or number and need to sort accordingly
	});
    }
    return list;
}

async function downloadFromPreview(el, templateId, tok, post, country){

    el.classList.remove('downloadSubscriptionLg', 'downloadSubscriptionErrorLg', 'downloadSubscriptionSuccessLg');
    el.classList.add('fa', 'fa-spinner', 'fa-spin');
    
    try{
	if(templateId !== "null"){
	    // then just download the template file without dynamic changes
	    await templateDownload(templateId);
	}
	else{
	    // download subscription with dynamic changes
	    downloadSubscription(el, tok, post, country);
	}
	el.classList.add('downloadSubscriptionSuccessLg');
    }
    catch(err){
	console.log(err);
	el.classList.add('downloadSubscriptionErrorLg');
    }
    finally{
	el.classList.remove('fa', 'fa-spinner', 'fa-spin');
	setTimeout(() => {
	    el.classList.remove('downloadSubscriptionSuccessLg', 'downloadSubscriptionErrorLg');
	    el.classList.add('downloadSubscriptionLg');
	}, 5000)
    }
}

// Use these two global variables to keep track of sorting done since
// the static class below does not work on mobile...
var sortColG = 0;
var sorAscG = true;

// use a static class here mainly to circument using global variables,
// as well as protect the sort column variable
/*
class Sort {
    static _col = 0;
    static _asc = true;
    
    static getCol(){
	return this._col;
    }

    static setCol(sc){
	this._col = sc;
    }

    static getAsc(){
	return this._asc;
    }

    static setAsc(asc){
	this._asc = asc;
    }
}
*/
