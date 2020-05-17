document.addEventListener('DOMContentLoaded', () => {
    // different versions of this page could be delivered depending on
    // user status, so only attach event listeners if they exist on
    // this version of page
    let reqBut = document.getElementById('submitEmail');
    if (reqBut) {
        reqBut.addEventListener('click', e => {
            e.preventDefault();
            processEmail();
        })
    }
});

async function processEmail() {
    try {
        //hide any error messages
        //	document.getElementById('invalid').style.display = 'none';

        var button = document.getElementById('submitEmail');
        var buttonContainer = document.getElementById('submitButtonContainer');

        var emailInput = document.getElementById('email');
        var email = emailInput.value.trim();
        var emailErrorSpan = document.getElementById('emailError');

        disableElements([button, emailInput]);
        showSpinner(buttonContainer);

        if (!validateEmail(email, emailInput, emailErrorSpan)) return;

        hideElements(document.getElementsByClassName('usa-alert'));

        let response = await submitRequest(email);
        var res = await response.json();

        processServerResponse(res);
    }
    catch (err) {
        console.log(err);

        processServerResponse({ error: true })

    }
    finally {
        if (!res || !res.success) {
            enableElements([button, email]);
            removeSpinner(buttonContainer);
        }
    }
}

//regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validateEmail(email, emailInput, errorSpan, showErrors = true) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (showErrors) {
        // remove errors caused by previous submission attempts
        // and add errors back if necessary
        errorSpan.style.display = 'none';
        emailInput.classList.remove('usa-input--error');

        if (!re.test(String(email).toLowerCase())) {

            emailInput.classList.add('usa-input--error');
            errorSpan.innerText = "Please enter valid email";
            errorSpan.style.display = 'block';
            return false;
        }
        return true;
    }
    else {
        // as user types, we just want to remove email error if they enter
        // already tried submitting and now are entering valid email
        if (re.test(String(email).toLowerCase())) {
            errorSpan.style.display = 'none';
            emailInput.classList.remove('usa-input--error');
            return true;
        }
        return false;

    }

    // this statement doesn't ever execute    
    return true;
}
function processServerResponse(context) {
    let emailForm = document.getElementById('loginFormOuterContainer');
    let invalidSpan = document.getElementById('invalid');
    invalidSpan.style.display = 'none';

    if (context.success) {
        document.getElementById('submitEmail').innerText = 'Redirecting...';
        window.location = context.redirect;
    }
    else if (context.notFound) {
        invalidSpan.innerHTML = 'Email not found';
        invalidSpan.style.display = 'block';
    }
    else if (context.alreadyVerified) {
        invalidSpan.innerHTML = 'Account already verified - <a href="/login" class="sm usa-link">Login</a>';
        invalidSpan.style.display = 'block';
    }
    else {
        document.getElementById('errorAlert').style.display = 'block';
        document.getElementById('loginFormOuterContainer').style.display = 'none';
        emailForm.style.display = 'none';
    }
}
