document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('showPassword').addEventListener('click', function (e) {
        e.preventDefault();
        let pwd = document.getElementById('newPassword');
        let pwdMatch = document.getElementById('newPasswordRe');
        let oldPwd = document.getElementById('oldPassword');

        if (pwd.getAttribute('type') === 'password') {
            oldPwd.setAttribute('type', 'text');
            pwd.setAttribute('type', 'text');
            pwdMatch.setAttribute('type', 'text');
            this.innerText = 'Hide password';
        }
        else {
            oldPwd.setAttribute('type', 'password');
            pwd.setAttribute('type', 'password');
            pwdMatch.setAttribute('type', 'password');
            this.innerText = 'Show password';
        }

    })

    document.getElementById('submitNewPassword').addEventListener('click', e => {
        e.preventDefault();
        if (valid_password(true)) update_password();
    });
})
function show_password_form() {
    let passwordBtn = document.getElementById('changePasswordBtnDiv');
    let passwordForm = document.getElementById('passwordFormContainer');

    passwordBtn.classList.add('hidden');
    passwordBtn.classList.remove('shown');

    passwordForm.classList.remove('hidden');
    passwordForm.classList.add('shown');
}
function hide_password_form() {
    let passwordBtn = document.getElementById('changePasswordBtnDiv');
    let passwordForm = document.getElementById('passwordFormContainer');

    passwordForm.classList.remove('shown');
    passwordForm.classList.add('hidden');
    passwordBtn.classList.add('show');
    passwordBtn.classList.remove('hidden');

}
async function update_password() {
    try {
        document.getElementById('submitNewPassword').disabled = true;
        show_spinner(document.getElementById('submitBtnDiv'));
        let context = await submit_password();

        hide_elements($('.changePasswordAlert'));
        //check if server found any issues with password
        invalid_password_server(context);
    }
    catch (err) {
        console.log(err);
        hide_elements($('.changePasswordAlert'));
        document.getElementById('alertError').display = 'block';
    }
    remove_spinner(document.getElementById('submitBtnDiv'));
    document.getElementById('submitNewPassword').disabled = false;
}

function update_regex_validation_marks(field, arr, submit) {
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

    if (!validPassword && submit) $('#newPassword')[0].classList.add('usa-input--error');
    else if (validPassword) $('#newPassword')[0].classList.remove('usa-input--error');

    return validPassword;
}
function update_length_validation_mark(field, req, submit) {
    let validPassword = true;
    if (submit) clear_inner_text($('.passwordError'));

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
/* name: valid_password
   preconditions: user has clicked submit on change password form, or just entered input
                  into New password field   
   postconditions: determine if user has entered valid new password
   description:
*/
function valid_password(submit = false) {
    var newPassword = $('#newPassword')[0];
    var newPasswordRe = $('#newPasswordRe')[0];

    let lowerCase = /[a-z]/g;
    let upperCase = /[A-Z]/g;
    let numbers = /[0-9]/g;
    let special = /\W|_/g;
    let minLength = 8;

    let validPassword = update_regex_validation_marks(newPassword, [
        { regex: lowerCase, elements: $('.lowercaseReq') },
        { regex: upperCase, elements: $('.uppercaseReq') },
        { regex: numbers, elements: $('.numberReq') },
        { regex: special, elements: $('.specialReq') }
    ], submit);

    validPassword = update_length_validation_mark(newPassword, {
        minLength: minLength,
        elements: $('.minCharReq')
    }, submit) && validPassword;

    if (submit && validPassword && newPassword.value !== newPasswordRe.value) {
        $('#newPasswordReError')[0].innerText = 'Password re-entry mismatch';
        $('#newPasswordReError')[0].style.display = 'block';
        newPasswordRe.classList.add('usa-input--error');
        validPassword = false;
    }
    else {
        newPasswordRe.classList.remove('usa-input--error');
        $('#newPasswordReError')[0].style.display = 'none';
        validPassword = validPassword && true;
    }

    return validPassword;
}

/* name: invalid_password_server
   preconditions: ajax req was made to server. Server determined something
                  the user sent was invalid.
   postconditions: user is notified of reason server rejected
   description: this method should rarely ever be called. Only two cases when this
                method should actually run. 1. user enters wrong password as "Old
		password" field. 2. if user tampers with client side
		validation checking and bypasses validate password in
		account.js (this file). Server runs additional validation
		to catch this, in which case this method will run.
*/
function invalid_password_server(context) {
    if (context.passwordUpdated) { //pword updated in db
        document.getElementById('alertSuccess').style.display = 'block';
        document.getElementById('passwordFormContainer').style.display = 'none';
    }
    else { //figure out which method to give user and where on screen to place
        //new password doesn't meet criteria
        //(8+ char, 1+ uppercase, 1+ lowercase, 1+ number, 1+ special char)
        if (context.invalidNewPassword) {
            document.getElementById('alertInfo').style.display = 'block';
            document.getElementById('newPasswordError').innerText = context.invalidMessage;
            document.getElementById('newPasswordError').style.display = 'block';
        }
        //new password re-entry mismatch
        else if (context.invalidNewPasswordRe) {
            document.getElementById('alertWarning').style.display = 'block';
            document.getElementById('newPasswordReError').innerText = context.invalidMessage;
            document.getElementById('newPasswordReError').style.display = 'block';
        }
        //incorect old password was provided by user
        else if (context.invalidOldPassword) {
            document.getElementById('alertInfo').style.display = 'block';
            document.getElementById('oldPasswordError').innerText = context.invalidMessage;
            document.getElementById('oldPasswordError').style.display = 'block';
        }
        else { //server error occurred
            document.getElementById('alertError').style.display = 'block';
            document.getElementById('passwordFormContainer').style.display = 'none';
        }
    }
}

