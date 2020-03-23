document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('submitNewPassword').addEventListener('click', e => {
	e.preventDefault();
	update_password();
    });

})

function update_password(){
    
    password_validation();
}

function password_validation(){
    var popoverField = $('#newPassword');
    var newPassword = $('#newPassword')[0];
    var newPasswordRe = $('#newPasswordRe')[0];
    
    let lowerCase = /[a-z]/g;
    let upperCase = /[A-Z]/g;
    let numbers = /[0-9]/g;
    let minLength = 8;
    let validPassword = false;
    
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
