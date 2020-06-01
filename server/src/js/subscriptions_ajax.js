import * as utility from './utility.js';
import {clearUserSubscriptions, populateSubscriptionTable,
	checkEmptySubscriptions, newSubscriptionSuccess,
	addDownloadFromPreview, pdfToCanvas, clearDropdown,
	addSubscriptionToTable, populateTemplateDropdown,
	displayUnsubscribeAlert, updateTable,
	checkPreviousAllowance99} from './subscriptions.js';

export function templatePreview(templateId, tok = null) {
    var label = document.getElementById('previewTemplateLabel');
    var docContainer = document.getElementById('canvasSpinnerContainer');

    label.innerText = "Loading ";
    utility.showSpinner(docContainer, '-lg');
    utility.showSpinner(label);
    $('#previewTemplateModal').modal({ keyboard: true, focus: true });

    let fe;

    if (templateId) {
        fe = fetch(`/preview_template?templateId=${templateId}`)
    }
    else {
        fe = fetch(`/preview_subscription?tok=${tok}`)
    }

    fe.then(response => {
        if (response.status == 200)
	    return response.json();
        throw new Error("Error retrieving file");
    })
        .then(res => {
	    if (!res.success)
                throw new Error("Error retrieving file");
	    utility.removeSpinner(label);

	    label.innerText = res.filename;
	    addDownloadFromPreview(label, templateId, tok, res.post, res.country);
	    
	    let uint8arr = new Uint8Array(res.file.data);
	    return pdfToCanvas(uint8arr);
        })
        .then(() => {
	    document.getElementById('previewCanvas').classList.add('light-border');
        })
        .catch(err => {
	    console.log(err);
	    label.innerText = err;
        })
        .finally(() => {
	    utility.removeSpinner(docContainer, '-lg');
	    docContainer.innerText = "";
        })
}
export function templateDownload(templateId) {
    var dlts = document.getElementById('downloadTemplateSpan');
    dlts.classList.remove('downloadError', 'downloadSuccess');

    utility.showSpinner(dlts, ' md', true);
    return fetch(`/download_template?templateId=${templateId}`)
        .then(response => {
	    if (response.status == 200)
                return response.json();
	    throw new Error("Error retrieving file");
        })
        .then(res => {
	    if (!res.success)
                throw new Error("Error retrieving file");

	    utility.clientDownloadFile(res);

	    dlts.classList.add('downloadSuccess');
        })
        .catch(err => {
	    console.log(err);
	    dlts.classList.add('downloadError');
	    throw new Error("Error retrieving file");
        })
        .finally(() => {
	    utility.removeSpinner(dlts, ' md');
        })

}

export async function submitNewSubscription() {
    let uploadTemp = document.getElementById('uploadTemplate');
    let prevTemp = document.getElementById('templateSelect');
    let post = document.getElementById('postSelect');
    let postId = post[post.selectedIndex].getAttribute('data-COLARatesId');

    utility.showSpinner(document.getElementById('subscriptionsContainerSpinner'));
    document.getElementById('tableSpinner').display = 'inline-block';

    try {
        if (uploadTemp.value) {
	    var upload = true;
	    var result = await addNewSubscriptionWithTemplateFile(postId, uploadTemp);
        }
        else if (prevTemp.selectedIndex != 0) {
	    var previous = true;
	    var result = await addNewSubscriptionPrevTemplate(postId, prevTemp);
        }

        if (result.success) { //reset post dropdown/files selection
	    post.selectedIndex = 0;
	    prevTemp.selectedIndex = 0;
	    uploadTemp.value = "";
	    newSubscriptionSuccess(postId);

	    let tempFetch = fetchUserTemplates();

	    addSubscriptionToTable(result);
        }
        else if (result.error)
	    throw new Error(result.error); //custom error originating from server
        else
	    throw result; //something else went wrong
    }
    catch (err) {
        console.log(err);
        utility.hideElements(document.getElementsByClassName('alert'));
        if (!result.success) {
	    document.getElementById('warningContainer').style.display = 'block';
	    if (upload) {
                document.getElementById('uploadTemplateErrorMsg').innerText = result.errorMessage;
                document.getElementById('uploadTemplateErrorMsg').style.display = 'block';
	    }
	    else {
                document.getElementById('previousTemplateErrorMsg').innerText = result.errorMessage;
                document.getElementById('previousTemplateErrorMsg').style.display = 'block';
	    }
        }
        else {
	    document.getElementById('errorContainer').style.display = 'block';

        }
    }
    finally {
        document.getElementById('tableSpinner').display = 'none';
        utility.removeSpinner(document.getElementById('subscriptionsContainerSpinner'));
        checkEmptySubscriptions();
    }
}

export async function addNewSubscriptionPrevTemplate(postId, prevTemp) {
    try {
        let context = {
	    postId: postId,
	    templateId: prevTemp[prevTemp.selectedIndex].getAttribute('data-templateId')
        };

        var response = await fetch('/add_new_subscription_with_prev_template', {
	    method: 'POST',
	    headers: {
                'Content-Type': 'application/JSON'
	    },
	    body: JSON.stringify(context)
        })

        return await response.json();
    }
    catch (err) {
        console.log(err);
        return err;
	
    }
}

export async function addNewSubscriptionWithTemplateFile(postId, uploadTemp) {
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        console.log("File API not supported by broser");
        $('addSubscriptionMessageDiv').innerText = "Incompatible browser"
        return;
    }

    try {
        let fd = new FormData();
        fd.append('upload', uploadTemp.files[0]);
        fd.append('postId', postId);

        var response = await fetch('/add_new_subscription_with_template_file', {
	    method: 'POST',
	    body: fd
        })

        return await response.json();
    }
    catch (err) {
        console.log(err);
        return err;
    }
}



export async function fetchUserTemplates() {
    try {
        var templateSelect = document.getElementById('templateSelect');
        clearDropdown(templateSelect);
        templateSelect.innerHTML = '<option>Loading...<i class="fa fa-spinner spinner"></i></option>';

        let response = await fetch('/get_user_template_list')
        let res = await response.json();

        clearDropdown(templateSelect);

        populateTemplateDropdown(templateSelect, res.templates);
    }
    catch (err) {
        console.log(err);
        templateSelect.innerHTML = '<option>Error retrieving templates</option>';
    }
    finally {
    }
}

export async function fetchUserSubscriptionList() {
    try {
        clearUserSubscriptions();
        let response = await fetch('/get_user_subscription_list')
        let res = await response.json();
        utility.removeSpinner(document.getElementById('subscriptionsContainerSpinner'));
        populateSubscriptionTable(res);
        checkEmptySubscriptions();
    }
    catch (err) {
        console.log(err);
    }
}



/* name: deleteSubscription
   preconditions: tok contains all necessary info needed in /delete_subscriptions route,
   most importantly subscriptionId and makeActive (bool)
   post/country technically not necessary, and will only be required if an
   unexpected error occurs, to display to user - else, not needed.
   thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been either deactivated or reactivated, depending on
   calling context and token
*/
export async function deleteSubscription(thisEl, tok, post, country, subscriptionId) {
    try {
        var context = {};
        var spinner = document.getElementById('tableSpinner');
        var tableCover = document.getElementById('tableCover');

        if (thisEl) {
	    thisEl.parentNode.disabled = true;
	    utility.classTimer(thisEl, 'trashCan', 'trashCanSecondary');
        }

        tableCover.style.display = 'block';
        spinner.style.display = 'inline-block';

        let response = await fetch(`/delete_subscription?tok=${tok}`)
        let res = await response.json();


        utility.hideElements(document.getElementsByClassName('unsubscribeAlert'));
        if (res.deleted) {
	    displayUnsubscribeAlert(document.getElementById('unsubscribeAlertSuccess'),
				    res.post, res.country, res.tok, subscriptionId);
	    updateTable(subscriptionId, true);

        }
        else if (res.restored) {
	    displayUnsubscribeAlert(document.getElementById('resubscribeAlertSuccess'),
				    res.post, res.country);
	    updateTable(subscriptionId, false);
        }
        else
	    throw new Error(`Error updating ${res.country} (${res.post})`);

    }
    catch (err) {
        if (err) console.log(err);
        displayUnsubscribeAlert(document.getElementById('unsubscribeAlertError'), post, country);
    }
    finally {

        if (thisEl) {
	    thisEl.parentNode.disabled = false;
	    utility.classTimer(thisEl, 'trashCanSecondary', 'trashCan');
        }
        tableCover.style.display = 'block';
        //	tableCover.style.animation = 'slideCoverRemove 0.5s 1 forwards';
        spinner.style.display = 'none';
        checkEmptySubscriptions();
        checkPreviousAllowance99();
    }
}


/* name: downloadSubscription
   preconditions: tok contains all necessary info needed in /download_subscription route,
   most importantly subscriptionId. Server validates requested template 
   belongs to requester. 
   post/country technically not necessary, and will only be required if an
   unexpected error occurs, to display to user - else, not needed.
   thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
   if error occurred somewhere in process.
*/
export function downloadSubscription(thisEl, tok, post, country) {
    var spinner = document.getElementById('tableSpinner');
    spinner.style.display = 'inline-block';

    thisEl.parentNode.disabled = true;
    utility.classTimer(thisEl, 'downloadSubscription', 'downloadSubscriptionSecondary');
    return fetch(`/download_subscription?tok=${tok}`)
        .then(response => {
	    if (response.status == 200)
                return response.json();
	    throw new Error("Error retrieving file");
        })
        .then(res => {
	    if (!res.success)
                throw new Error("Error retrieving file");

	    utility.clientDownloadFile(res);
	    utility.classTimer(thisEl, 'downloadSubscriptionSecondary', 'downloadSubscriptionSuccess', 'downloadSubscription', 3000);
        })
        .catch(err => {
	    console.log(err);
	    utility.hideElements(document.getElementsByClassName('unsubscribeAlert'));
	    document.getElementById('downloadSubscriptionAlertError').style.display = 'block';
	    document.getElementById('downloadSubscriptionErrorMsgSpan').innerText = `${country} (${post})`;
	    utility.classTimer(thisEl, 'downloadSubscriptionSecondary', 'downloadSubscriptionError', 'downloadSubscription', 8000);
        })
        .finally(() => {
	    thisEl.parentNode.disabled = false;
	    spinner.style.display = 'none';

        })
}
/* name: fireSubscriptionEmail
   preconditions: tok contains all necessary info needed in /fire_subscription_email route,
   most importantly subscriptionId. Server validates requested template 
   belongs to requester. 
   post/country technically not necessary, and will only be required if an
   unexpected error occurs, to display to user - else, not needed.
   thisEl is reference to <i> element that contains download icon.
   postconditions: subscription has been downloaded. Error message displayed to user
   if error occurred somewhere in process.
*/
export function fireSubscriptionEmail(thisEl, tok, post, country) {
    var spinner = document.getElementById('tableSpinner');
    spinner.style.display = 'inline-block';

    thisEl.parentNode.disabled = true;
    utility.classTimer(thisEl, 'email', 'emailSecondary');

    return fetch(`/fire_subscription_email?tok=${tok}`)
        .then(response => {
	    if (response.status == 200)
                return response.json();
	    throw new Error("Error retrieving file");
        })
        .then(res => {
	    if (!res.success)
                throw new Error("Error retrieving file");

	    utility.classTimer(thisEl, 'emailSecondary', 'emailSuccess', 'email', 3000);
        })
        .catch(err => {
	    console.log(err);
	    utility.hideElements(document.getElementsByClassName('unsubscribeAlert'));
	    document.getElementById('fireSubscriptionEmailAlertError').style.display = 'block';
	    document.getElementById('fireSubscriptionEmailErrorMsgSpan').innerText = `${country} (${post})`;
	    document.getElementById('fireSubscriptionEmailErrorToSpan').innerText = document.getElementById('userEmail').value;
	    utility.classTimer(thisEl, 'emailSecondary', 'emailError', 'email', 8000);
        })
        .finally(() => {
	    thisEl.parentNode.disabled = false;
	    spinner.style.display = 'none';

        })
}

