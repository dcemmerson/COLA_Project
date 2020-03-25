document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('submitNewPassword').addEventListener('click', e => {
	e.preventDefault();
	if(valid_password()) update_password();
    });
    document.getElementById('changePasswordBtn').addEventListener('click', e => {
	e.preventDefault();
	show_password_form();
    })

})
function show_password_form(){
    let passwordBtn = document.getElementById('changePasswordBtnDiv');
    let passwordForm = document.getElementById('passwordFormContainer');
    
    passwordBtn.style.visibility = 'hidden';

    passwordForm.classList.remove('hidden');
    passwordForm.classList.add('shown');
}
function hide_password_form(){
    let passwordBtn = document.getElementById('changePasswordBtnDiv');
    let passwordForm = document.getElementById('passwordFormContainer');

    passwordForm.classList.remove('shown');
    passwordForm.classList.add('hidden');
    passwordBtn.style.visibility = 'visible';

}
async function update_password(){
    let context = await submit_password();

    //check if server found any issues with password
    invalid_password_server(context);
}

/* name: valid_password
   preconditions: user has clicked submit on change password form
   postconditions: determine if user has entered valid new password
   description: this method should really ever be called. Only case when this
                method should actually run is if user tampers with client side
		validation checking and bypasses validate password in
		account.js (this file). Server runs additional validation
		to catch this, in which case this method will run.
*/
function valid_password(){
    var popoverField = $('#newPassword');
    var newPassword = $('#newPassword')[0];
    var newPasswordRe = $('#newPasswordRe')[0];
    
    let lowerCase = /[a-z]/g;
    let upperCase = /[A-Z]/g;
    let numbers = /[0-9]/g;
    let minLength = 8;
    let validPassword = false;
    let special = /\W|_/g
    
    //check for lower case letters in password
    if(newPassword.value.match(lowerCase) === null){
	newPassword.setAttribute('data-content',
				 'Must contain one or more lower case letter');
    }
    //check for upper case letters in password
    else if(newPassword.value.match(upperCase) === null){
	newPassword.setAttribute('data-content',
				 'Must contain one or more upper case letter');
    }
    //check for upper case letters in password
    else if(newPassword.value.match(numbers) === null){
	newPassword.setAttribute('data-content',
				 'Must contain at least one number');
    }
    else if(newPassword.value.match(special) === null){
	newPassword.setAttribute('data-content',
				 'Must contain at least one special'
				 + ' character (eg ^!@#$%^&*+=._-+)');
    }
    else if(newPassword.value.length < minLength){
	newPassword.setAttribute('data-content',
				 'Must contain at least 8 characters');
    }
    else if(newPassword.value !== newPasswordRe.value){
	popoverField = $('#newPasswordRe');
	newPasswordRe.setAttribute('data-content',
				   'Password mismatch');
    }
    else{
	validPassword = true;
    }

    if(!validPassword){
	popoverField.popover('show');
	setTimeout((popfie) => {
	    popfie.popover('dispose');
	}, 3000, popoverField);
    }
	
    return validPassword;
}

/* name: invalid_password_server
   preconditions: ajax req was made to server. Server determined something
                  the user sent was invalid.
   postconditions: user is notified of reason server rejected
   description: this method should really ever be called. Only two cases when this
                method should actually run. 1. user enters wrong password as "Old
		password" field. 2. if user tampers with client side
		validation checking and bypasses validate password in
		account.js (this file). Server runs additional validation
		to catch this, in which case this method will run.
*/
function invalid_password_server(context){
    var popoverField = $('#newPassword');
    var newPassword = $('#newPassword')[0];
    var newPasswordRe = $('#newPasswordRe')[0];
    var oldPassword = $('#oldPassword')[0];
    
    if(context.passwordUpdated){ //pword updated in db
	popoverField = $('#changePasswordBtn');
	$('#changePasswordBtn')[0].setAttribute('data-content', context.successMessage);
	hide_password_form();
    }
    else{ //figure out which method to give user and where on screen to place
	//new password doesn't meet criteria
	//(8+ char, 1+ uppercase, 1+ lowercase, 1+ number, 1+ special char)
	if(context.invalidNewPassword){
	    newPassword.setAttribute('data-content', context.invalidMessage);
	}
	//new password re-entry mismatch
	else if(context.invalidNewPasswordRe){
	    newPasswordRe.setAttribute('data-content', context.invalidMessage);
	    popoverField = $('#newPasswordRe');
	}
	//incorect old password was provided by user
	else if(context.invalidOldPassword){
	    oldPassword.setAttribute('data-content', context.invalidMessage);
	    popoverField = $('#oldPassword');
	}
	else{
	    oldPassword.setAttribute('data-content', context.invalidMessage);
	    popoverField = $('#oldPassword');
	}
    }   

    popoverField.popover('show');
    setTimeout((popfie) => {
	popfie.popover('dispose');
    }, 3000, popoverField);
}
