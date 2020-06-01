document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submitEmail').addEventListener('click', event => {
        event.preventDefault();
        processEmail();
    })
    displayReturnToTop();
})

async function processEmail() {
    try {
        var button = document.getElementById('submitEmail');
        var buttonContainer = document.getElementById('submitButtonContainer');
        var emailInput = document.getElementById('email');
        var email = emailInput.value.trim();
        var errorSpan = document.getElementById('emailError');


        disableElements([button, email]);
        showSpinner(buttonContainer);

        if (!validateEmail(email, emailInput, errorSpan)) return;

        hideElements(document.getElementsByClassName('usa-alert'));

        let response = await submitRequest(email);
        let res = await response.json();
        processServerResponse(res);
    }
    catch (err) {
        console.log(err);

        processServerResponse({
            error: true
        })
    }
    finally {
        enableElements([button, email]);
        removeSpinner(buttonContainer);
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
function processServerResponse(context) {
    let emailForm = document.getElementById('formOuterContainer');
    if (context.success) {
        var alert = document.getElementById('successAlert');
        emailForm.style.display = 'none';
    }
    else if (context.notFound) {
        var alert = document.getElementById('warningAlert');
    }
    else if (context.error) {
        var alert = document.getElementById('errorAlert');
        emailForm.style.display = 'none';
    }
    alert.style.display = 'block';
    alert.getElementsByClassName('alertEmail')[0].innerText = context.email;
}

