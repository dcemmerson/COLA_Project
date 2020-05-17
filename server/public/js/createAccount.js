document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('showPassword').addEventListener('click', function (e) {
        e.preventDefault();
        let pwd = document.getElementById('password');
        let pwdMatch = document.getElementById('passwordRe');
        if (pwd.getAttribute('type') === 'password') {
            pwd.setAttribute('type', 'text');
            pwdMatch.setAttribute('type', 'text');
            this.innerText = 'Hide password';
        }
        else {
            pwd.setAttribute('type', 'password');
            pwdMatch.setAttribute('type', 'password');
            this.innerText = 'Hide password';
        }

    });

    document.getElementById('submitNewAccount').addEventListener('click', e => {
        e.preventDefault();
        if (validEmailAddMarks() && validPassword(true)) {
            createAccount();
        }
    });
});

async function createAccount() {
    try {
        //disable everything on form so user doesn't keep submitting or try
        //to make changes if RTT from server is slow				
        disableForm(document.getElementById('changePasswordForm'));
        removeServerErrors();

        showSpinner(document.getElementById('submitBtnDiv'));
        var context = await submitCredentials();

        //check if server found any issues with email/password
        processServerResponse(context);
    }
    catch (err) {
        console.log(err);
        //	hideElements(document.getElementsByClassName('changePasswordAlert'));
        document.getElementById('alertError').style.display = 'block';
        document.getElementById('formInnerContainer').styl.display = 'none';
    }
    finally {
        if (!context || !context.success) {
            removeSpinner(document.getElementById('submitBtnDiv'));
            enableForm(document.getElementById('changePasswordForm'));
        }
    }
}


function updateRegexValidationMarks(field, arr, submit) {
    let validPassword = true;
    arr.forEach(val => {
        if (field.value.match(val.regex) === null) {
            for (let i = 0; i < val.elements.length; i++)
                val.elements[i].classList.remove('val', 'invalid', 'invalBlank');
            validPassword = false;

            if (submit)
                for (let i = 0; i < val.elements.length; i++)
                    val.elements[i].classList.add('invalid');

            else
                for (let i = 0; i < val.elements.length; i++)
                    val.elements[i].classList.add('invalBlank');
        }
        else {
            for (let i = 0; i < val.elements.length; i++) {
                val.elements[i].classList.remove('invalBlank', 'invalid');
                val.elements[i].classList.add('val');
            }
        }
    });

    if (!validPassword && submit)
        document.getElementById('password').classList.add('usa-input--error');
    else if (validPassword) {
        document.getElementById('password').classList.remove('usa-input--error');
    }
    return validPassword;
}

function updateLengthValidationMark(field, req, submit) {
    let validPassword = true;
    if (submit) clearInnerText(document.getElementsByClassName('passwordError'));

    if (field.value.length < req.minLength) {
        for (let i = 0; i < req.elements.length; i++)
            req.elements[i].classList.remove('val', 'invalid', 'invalBlank');
        validPassword = false;

        if (submit)
            for (let i = 0; i < req.elements.length; i++)
                req.elements[i].classList.add('invalid');
        else
            for (let i = 0; i < req.elements.length; i++)
                req.elements[i].classList.add('invalBlank');
    }
    else {
        for (let i = 0; i < req.elements.length; i++) {
            req.elements[i].classList.remove('invalBlank', 'invalid');
            req.elements[i].classList.add('val');
        }
    }

    return validPassword;
}

/* name: validEmail
   preconditions: user has clicked submit on create account form 
   postconditions: determine if user has entered valid email address format
   description: calls validEmailAddMarks calls validEmail to check if email
                provided is valid, and adds markup/styling if not valid, else
		any markup/styling from previous calls is removed.
*/
//regex: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validEmailAddMarks() {
    var emailInput = document.getElementById('email');
    var email = emailInput.value;
    var emailErrorSpan = document.getElementById('emailError');
    //remove errors caused by previous submission attempts
    emailErrorSpan.style.display = 'none';
    emailInput.classList.remove('usa-input--error');


    if (!validEmail(emailInput)) {
        emailInput.classList.add('usa-input--error');
        emailErrorSpan.innerText = "Please enter valid email";
        emailErrorSpan.style.display = 'block';
        document.getElementById('email').classList.add('usa-input--error');
        return false;
    }


    return true;
}
/* name: validEmail
   preconditions: emailInput is user email input field.
   postconditions: regular epxression used to check if email address fits valid format.
                   returns true if valid, else false. Removes markup/styling if
		   email is valid format
  description: this method can be called from the "oninput" field in the html doc,
               or upon user submitting new account information.
*/
function validEmail(emailInput = document.getElementById('email')) {
    let email = emailInput.value;
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!re.test(String(email).toLowerCase())) {
        return false
    }

    //if user entered valid email, remove any potential errors, shown when user submitted
    emailInput.classList.remove('usa-input--error');
    document.getElementById('emailError').style.display = 'none';

    return true;
}

/* name: validPassword
   preconditions: user has clicked submit on create account form, or just entered input
                  into New password field   
   postconditions: determine if user has entered valid new password
   description:
*/
function validPassword(submit = false) {
    var password = document.getElementById('password');
    var passwordRe = document.getElementById('passwordRe');

    let lowerCase = /[a-z]/g;
    let upperCase = /[A-Z]/g;
    let numbers = /[0-9]/g;
    let special = /\W|_/g;
    let minLength = 8;

    let validPassword = updateRegexValidationMarks(password, [
        { regex: lowerCase, elements: document.getElementsByClassName('lowercaseReq') },
        { regex: upperCase, elements: document.getElementsByClassName('uppercaseReq') },
        { regex: numbers, elements: document.getElementsByClassName('numberReq') },
        { regex: special, elements: document.getElementsByClassName('specialReq') }
    ], submit);

    validPassword = updateLengthValidationMark(password, {
        minLength: minLength,
        elements: document.getElementsByClassName('minCharReq')
    }, submit) && validPassword;

    if (submit && validPassword && password.value !== passwordRe.value) {
        document.getElementById('passwordReError').innerText = 'Password re-entry mismatch';
        document.getElementById('passwordReError').style.display = 'block';
        passwordRe.classList.add('usa-input--error');
        validPassword = false;
    }
    else {
        passwordRe.classList.remove('usa-input--error');
        document.getElementById('passwordReError').style.display = 'none';
        validPassword = validPassword && true;
    }

    return validPassword;
}

/* name: processServerResponse
   preconditions: ajax req was made to server. Server either changes user
                  password or notifies user if there was an issue
   postconditions: user is notified of reason server rejected, or password change
   description: this method should rarely ever be called and show user error.
                Errors should have been caught by client-side validation.
                Two possibilites when this method is called:
                1. user successfully creates account
		2. if user tampers with client side
		validation checking and bypasses validate password in
		recover.js (this file). Server runs additional validation
		to catch this, in which case this method will run and show issue.
*/
function processServerResponse(context) {
    if (context.accountCreated) {
        document.getElementById('submitNewAccount').innerText = 'Redirecting...';
        window.location = context.redirect;
    }
    else { //figure out which method to give user and where on screen to place
        //new password doesn't meet criteria
        //(8+ char, 1+ uppercase, 1+ lowercase, 1+ number, 1+ special char)
        if (context.userAlreadyExists || context.invalidEmail) {
            document.getElementById('emailError').innerText = context.invalidMessage;
            document.getElementById('emailError').style.display = 'block';
            document.getElementById('email').classList.add('usa-input--error');
        }
        else if (context.invalidNewPassword) {
            //	    document.getElementById('alertInfo').style.display = 'block';
            document.getElementById('passwordError').innerText = context.invalidMessage;
            document.getElementById('passwordError').style.display = 'block';
            document.getElementById('password').classList.add('usa-input--error');
        }
        //new password re-entry mismatch
        else if (context.invalidNewPasswordRe) {
            //	    document.getElementById('alertWarning').style.display = 'block';
            document.getElementById('passwordReError').innerText = context.invalidMessage;
            document.getElementById('passwordReError').style.display = 'block';
            document.getElementById('passwordRe').classList.add('usa-input--error');
        }
        else {
            document.getElementById('alertError').style.display = 'block';
            document.getElementById('formInnerContainer').style.display = 'none';
        }
    }
}

function removeServerErrors() {
    document.getElementById('emailError').innerText = '';
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').innerText = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordReError').innerText = '';
    document.getElementById('passwordReError').style.display = 'none';
}
