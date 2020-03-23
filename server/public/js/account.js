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
    var newPassword = $('#newPassword')[0];
/*    var letter = document.getElementById('letter');
    var capital = document.getElementById('capital');
    var number = document.getElementById('number');
    var length = document.getElementById('length');
    var message = document.getElementById('message');
*/
/*    newPassword.addEventListener('focus', () => {
//	message.style.display = 'block';
    })
    newPassword.addEventListener('blur', () => {
//	message.style.display = 'none';
    })
*/
    //    newPassword.addEventListener('keyup', () => {
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
    else{
	validPassword = true;
    }

    if(!validPassword){
	$('#newPassword').popover('show');
	setTimeout(() => {
	    $('#newPassword').popover('hide');
	}, 3000);
    }
	
    return validPassword;
    
}
