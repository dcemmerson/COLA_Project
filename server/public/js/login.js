document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submitCredentials').addEventListener('click', e => {
        e.preventDefault()
        processCredentials();
    })
    displayReturnToTop();

})
async function processCredentials() {
    try {
        //hide any error messages
        document.getElementById('invalid').style.display = 'none';

        var button = document.getElementById('submitCredentials');
        var buttonContainer = document.getElementById('submitButtonContainer');

        var emailInput = document.getElementById('email');
        var email = emailInput.value.trim();
        var emailErrorSpan = document.getElementById('emailError');

        var password = document.getElementById('pwd').value;

        disableElements([button, email]);
        showSpinner(buttonContainer);

        if (!validateEmail(email, emailInput, emailErrorSpan)) return;

        hideElements(document.getElementsByClassName('usa-alert'));

        let response = await submitRequest(email, password);
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
function validateEmail(email, emailInput, errorSpan) {
    //remove errors caused by previous submission attempts
    errorSpan.style.display = 'none';
    emailInput.classList.remove('usa-input--error');

    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!re.test(String(email).toLowerCase())) {
        emailInput.classList.add('usa-input--error');
        errorSpan.innerText = "Please enter valid email";
        errorSpan.style.display = 'block';
        return false;
    }

    return true;
}
function processerverEesponse(context) {
    let emailForm = document.getElementById('formOuterContainer');
    if (context.success) {
        document.getElementById('submitCredentials').innerText = 'Redirecting...';
        window.location = context.redirect;
    }
    else if (context.invalid) {
        document.getElementById('invalid').style.display = 'block';
    }
    else {
        document.getElementById('errorAlert').style.display = 'block';
        document.getElementById('loginFormOuterContainer').style.display = 'none';
        emailForm.style.display = 'none';
    }
}
